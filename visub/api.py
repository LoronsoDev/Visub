"""
Web API interface for Visub subtitle generation.
This module provides functions that can be easily integrated with web frameworks
like Flask, FastAPI, or Django.
"""

import os
import tempfile
import json
from typing import Dict, List, Optional, Union
from pathlib import Path

from .config import SubtitleConfig, SpeakerStyle, SubtitlePosition, create_multi_speaker_config, create_auto_speaker_config
from .transcribe import word_transcribe
from .cli import get_audio, get_subtitles


class VisubAPI:
    """Main API class for video subtitle generation."""
    
    def __init__(self, temp_dir: Optional[str] = None):
        """
        Initialize the Visub API.
        
        Args:
            temp_dir: Directory for temporary files. Uses system temp if None.
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
    
    def process_video(
        self, 
        video_path: str, 
        output_dir: str,
        subtitle_config: Dict,
        transcription_config: Optional[Dict] = None
    ) -> Dict:
        """
        Process a video file and generate subtitles with custom styling.
        
        Args:
            video_path: Path to the input video file
            output_dir: Directory to save output files
            subtitle_config: Dictionary containing subtitle styling configuration
            transcription_config: Optional transcription settings
        
        Returns:
            Dictionary with results including paths to generated files
        """
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Parse configuration
        config = self._parse_subtitle_config(subtitle_config)
        trans_config = transcription_config or {}
        
        # Extract audio
        audio_paths = get_audio([video_path])
        
        # Create transcription function with config
        def transcribe_func(audio_path):
            return word_transcribe(
                audio_path,
                model=trans_config.get('model', 'base'),
                device=trans_config.get('device', 'cpu'),
                batch_size=trans_config.get('batch_size', 16),
                compute_type=trans_config.get('compute_type', 'int8'),
                language=trans_config.get('language', 'auto'),
                enable_diarization=config.enable_speaker_detection,
                hf_token=trans_config.get('hf_token') or os.getenv('HF_TOKEN')
            )
        
        # If speaker detection is enabled, first run transcription to detect speakers
        detected_speakers = set()
        if config.enable_speaker_detection:
            print("DEBUG: Pre-processing to detect speakers...")
            transcription_result = transcribe_func(list(audio_paths.values())[0])
            for segment in transcription_result.get("segments", []):
                if "words" in segment:
                    for word in segment["words"]:
                        if word.get("speaker"):
                            detected_speakers.add(word["speaker"])
            
            print(f"DEBUG: Detected speakers: {detected_speakers}")
            print(f"DEBUG: Total speakers found: {len(detected_speakers)}")
            
            # If speakers were detected, use auto-config with random colors
            if detected_speakers:
                print("DEBUG: Creating auto speaker config with random colors for detected speakers")
                config = create_auto_speaker_config(list(detected_speakers))
                config.max_words_per_subtitle = subtitle_config.get('max_words', 4)
                config.output_srt = subtitle_config.get('output_srt', False)
        
        # Generate subtitles
        subtitle_paths = get_subtitles(audio_paths, output_dir, transcribe_func, config)
        
        # Generate final video with embedded subtitles
        video_paths = {}
        for original_path, ass_path in subtitle_paths.items():
            import ffmpeg
            from .utils import filename
            
            output_video_path = os.path.join(output_dir, f"{filename(original_path)}.mp4")
            
            print(f"Adding subtitles to {filename(original_path)}...")
            
            video = ffmpeg.input(original_path)
            audio = video.audio
            
            ffmpeg.concat(
                video.filter('subtitles', ass_path), 
                audio, 
                v=1, 
                a=1
            ).output(output_video_path).run(quiet=False, overwrite_output=True)
            
            video_paths[original_path] = output_video_path
            print(f"Saved subtitled video to {output_video_path}")
        
        # Prepare results
        results = {
            'status': 'success',
            'video_path': video_path,
            'subtitle_files': subtitle_paths,
            'video_files': video_paths,
            'config_used': {
                'max_words': config.max_words_per_subtitle,
                'speaker_detection': config.enable_speaker_detection,
                'output_srt': config.output_srt,
                'speakers': len(detected_speakers)
            }
        }
        
        return results
    
    def _parse_subtitle_config(self, config_dict: Dict) -> SubtitleConfig:
        """
        Parse subtitle configuration from dictionary format.
        
        Expected format:
        {
            "max_words": 4,
            "output_srt": false,
            "enable_speaker_detection": true,
            "speakers": [
                {
                    "speaker_id": "SPEAKER_00",
                    "font_family": "Arial",
                    "font_size": 30,
                    "color": "#FFFFFF",
                    "position": "bottom_center",
                    "bold": false,
                    "italic": false
                }
            ]
        }
        """
        config = SubtitleConfig()
        
        config.max_words_per_subtitle = config_dict.get('max_words', 4)
        config.output_srt = config_dict.get('output_srt', False)
        config.enable_speaker_detection = config_dict.get('enable_speaker_detection', False)
        
        # Parse speaker configurations
        speakers = config_dict.get('speakers', [])
        if speakers:
            config = create_multi_speaker_config(speakers)
            config.max_words_per_subtitle = config_dict.get('max_words', 4)
            config.output_srt = config_dict.get('output_srt', False)
        
        return config
    
    def get_supported_models(self) -> List[str]:
        """Get list of supported WhisperX models."""
        return [
            "tiny", "tiny.en", "base", "base.en", "small", "small.en",
            "medium", "medium.en", "large-v1", "large-v2", "large-v3",
            "large", "distil-large-v2", "distil-medium.en", "distil-small.en",
            "distil-large-v3", "large-v3-turbo", "turbo"
        ]
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages for transcription."""
        return [
            "auto", "af", "am", "ar", "as", "az", "ba", "be", "bg", "bn", "bo", 
            "br", "bs", "ca", "cs", "cy", "da", "de", "el", "en", "es", "et", 
            "eu", "fa", "fi", "fo", "fr", "gl", "gu", "ha", "haw", "he", "hi", 
            "hr", "ht", "hu", "hy", "id", "is", "it", "ja", "jw", "ka", "kk", 
            "km", "kn", "ko", "la", "lb", "ln", "lo", "lt", "lv", "mg", "mi", 
            "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "nn", "no", 
            "oc", "pa", "pl", "ps", "pt", "ro", "ru", "sa", "sd", "si", "sk", 
            "sl", "sn", "so", "sq", "sr", "su", "sv", "sw", "ta", "te", "tg", 
            "th", "tk", "tl", "tr", "tt", "uk", "ur", "uz", "vi", "yi", "yo", "zh"
        ]
    
    def get_supported_positions(self) -> List[Dict]:
        """Get list of supported subtitle positions."""
        return [
            {"value": "bottom_left", "label": "Bottom Left"},
            {"value": "bottom_center", "label": "Bottom Center"},
            {"value": "bottom_right", "label": "Bottom Right"},
            {"value": "middle_left", "label": "Middle Left"},
            {"value": "middle_center", "label": "Middle Center"},
            {"value": "middle_right", "label": "Middle Right"},
            {"value": "top_left", "label": "Top Left"},
            {"value": "top_center", "label": "Top Center"},
            {"value": "top_right", "label": "Top Right"}
        ]
    
    def validate_config(self, config_dict: Dict) -> Dict:
        """
        Validate subtitle configuration dictionary.
        
        Returns:
            Dictionary with validation results and any errors
        """
        errors = []
        warnings = []
        
        # Validate max_words
        max_words = config_dict.get('max_words', 4)
        if not isinstance(max_words, int) or max_words < 1:
            errors.append("max_words must be a positive integer")
        elif max_words > 50:
            warnings.append("max_words > 50 may result in very long subtitles")
        
        # Validate speakers
        speakers = config_dict.get('speakers', [])
        if not isinstance(speakers, list):
            errors.append("speakers must be a list")
        else:
            for i, speaker in enumerate(speakers):
                speaker_errors = self._validate_speaker_config(speaker, i)
                errors.extend(speaker_errors)
        
        # Check for duplicate speaker IDs
        speaker_ids = [s.get('speaker_id') for s in speakers if isinstance(s, dict)]
        if len(speaker_ids) != len(set(speaker_ids)):
            errors.append("Duplicate speaker IDs found")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _validate_speaker_config(self, speaker: Dict, index: int) -> List[str]:
        """Validate individual speaker configuration."""
        errors = []
        prefix = f"Speaker {index}: "
        
        if not isinstance(speaker, dict):
            return [f"{prefix}Must be a dictionary"]
        
        # Validate speaker_id
        speaker_id = speaker.get('speaker_id')
        if not speaker_id or not isinstance(speaker_id, str):
            errors.append(f"{prefix}speaker_id is required and must be a string")
        
        # Validate font_size
        font_size = speaker.get('font_size', 30)
        if not isinstance(font_size, int) or font_size < 8 or font_size > 100:
            errors.append(f"{prefix}font_size must be an integer between 8 and 100")
        
        # Validate color format
        color = speaker.get('color', '#FFFFFF')
        if isinstance(color, str):
            if color.startswith('#') and len(color) == 7:
                try:
                    int(color[1:], 16)  # Validate hex
                except ValueError:
                    errors.append(f"{prefix}Invalid hex color format")
            elif not color.startswith('&H'):
                errors.append(f"{prefix}Color must be hex (#RRGGBB) or ASS format (&H00BBGGRR)")
        
        # Validate position
        position = speaker.get('position', 'bottom_center')
        valid_positions = [pos['value'] for pos in self.get_supported_positions()]
        if position not in valid_positions:
            errors.append(f"{prefix}Invalid position. Must be one of: {valid_positions}")
        
        return errors


def create_api_instance(temp_dir: Optional[str] = None) -> VisubAPI:
    """Factory function to create a Visub API instance."""
    return VisubAPI(temp_dir)