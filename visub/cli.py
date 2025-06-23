import os
import ffmpeg
import argparse
import warnings
import tempfile
from .utils import filename, str2bool, ass_time, format_timedelta
from .transcribe import word_transcribe
from .config import SubtitleConfig, create_default_config
from datetime import timedelta

def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("video", nargs="+", type=str,
                        help="paths to video files to transcribe")
    parser.add_argument("--model", default="medium-v2",
                        help="name of the WhisperX model to use")
    parser.add_argument("--output_dir", "-o", type=str,
                        default=".", help="directory to save the outputs")
    parser.add_argument("--num_words", "-n", type=int, default=4,
                    help="maximum number of words to show (default: 4)")
    parser.add_argument("--output_srt", type=str2bool, default=False,
                        help="whether to output the .srt file along with the video files")
    parser.add_argument("--srt_only", type=str2bool, default=False,
                        help="only generate the .srt file and not create overlayed video")
    parser.add_argument("--language", type=str, default="auto", choices=["auto","af","am","ar","as","az","ba","be","bg","bn","bo","br","bs","ca","cs","cy","da","de","el","en","es","et","eu","fa","fi","fo","fr","gl","gu","ha","haw","he","hi","hr","ht","hu","hy","id","is","it","ja","jw","ka","kk","km","kn","ko","la","lb","ln","lo","lt","lv","mg","mi","mk","ml","mn","mr","ms","mt","my","ne","nl","nn","no","oc","pa","pl","ps","pt","ro","ru","sa","sd","si","sk","sl","sn","so","sq","sr","su","sv","sw","ta","te","tg","th","tk","tl","tr","tt","uk","ur","uz","vi","yi","yo","zh"], 
    help="What is the origin language of the video? If unset, it is detected automatically.")

    args = parser.parse_args().__dict__
    model_name: str = args.pop("model")
    output_dir: str = args.pop("output_dir")
    output_srt: bool = args.pop("output_srt")
    srt_only: bool = args.pop("srt_only")
    language: str = args.pop("language")
    num_words: int = args.pop("num_words")
    
    os.makedirs(output_dir, exist_ok=True)

    if model_name.endswith(".en"):
        warnings.warn(
            f"{model_name} is an English-only model, forcing English detection.")
        args["language"] = "en"
    # if translate task used and language argument is set, then use it
    elif language != "auto":
        args["language"] = language
        
    audios = get_audio(args.pop("video"))
    
    # Create subtitle configuration
    config = create_default_config()
    config.max_words_per_subtitle = num_words
    config.output_srt = output_srt or srt_only
    
    subtitles = get_subtitles(
        audios, 
        output_dir, 
        lambda audio_path: word_transcribe(audio_path, **args),
        config
    )

    if srt_only:
        return

    for path, ass_path in subtitles.items():
        out_path = os.path.join(output_dir, f"{filename(path)}.mp4")

        print(f"Adding subtitles to {filename(path)}...")

        video = ffmpeg.input(path)
        audio = video.audio

        # ffmpeg.concat(
        #     video.filter('subtitles', srt_path, force_style="OutlineColour=&H40000000,BorderStyle=3"), audio, v=1, a=1
        # ).output(out_path).run(quiet=True, overwrite_output=True)

        ffmpeg.concat(
            video.filter('subtitles', ass_path), 
            audio, 
            v=1, 
            a=1
        ).output(out_path).run(quiet=False, overwrite_output=True)

        print(f"Saved subtitled video to {os.path.abspath(out_path)}.")


def get_audio(paths):
    temp_dir = tempfile.gettempdir()

    audio_paths = {}

    for path in paths:
        print(f"Extracting audio from {filename(path)}...")
        output_path = os.path.join(temp_dir, f"{filename(path)}.wav")

        ffmpeg.input(path).output(
            output_path,
            acodec="pcm_s16le", ac=1, ar="16k"
        ).run(quiet=True, overwrite_output=True)

        audio_paths[path] = output_path

    return audio_paths


def get_subtitles(audio_paths: dict, output_dir: str, transcribe: callable, config: SubtitleConfig):
    """
    Generate word-by-word ASS subtitles with customizable styling per speaker.
    
    Args:
        audio_paths: Dict of {path: audio_path}
        output_dir: Directory for ASS/SRT output
        transcribe: Callable returning transcription with word-level timestamps
        config: SubtitleConfig object containing all styling preferences
    
    Returns:
        Dict of {path: ass_path}
    """
    subtitles_path = {}

    for path, audio_path in audio_paths.items():
        base_name = os.path.splitext(os.path.basename(path))[0]
        ass_path = os.path.join(output_dir, f"{base_name}.ass")
        srt_path = os.path.join(output_dir, f"{base_name}.srt") if config.output_srt else None
        
        print(f"Generating subtitles for {base_name}...")

        # Transcribe audio (assumes word-level timestamps)
        result = transcribe(audio_path)

        # Extract and group words into subtitles
        subtitle_groups = []
        
        for segment in result["segments"]:
            if "words" in segment:
                words_in_segment = segment["words"]
                
                # Group words into chunks of max_words_per_subtitle
                for i in range(0, len(words_in_segment), config.max_words_per_subtitle):
                    word_group = words_in_segment[i:i + config.max_words_per_subtitle]
                    
                    if word_group:  # Make sure group is not empty
                        # Get speaker information from first word in group
                        speaker_id = word_group[0].get("speaker", None)
                        
                        # Combine text from all words in group
                        combined_text = " ".join(word["word"] for word in word_group)
                        
                        subtitle_groups.append({
                            "start": word_group[0]["start"],
                            "end": word_group[-1]["end"],
                            "text": combined_text,
                            "speaker": speaker_id
                        })

        # Write ASS file with multiple styles
        with open(ass_path, "w", encoding="utf-8") as f:
            # Write ASS header
            f.write("""[Script Info]
Title: Word-by-Word Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
""")
            
            # Write all style definitions
            styles = config.get_all_styles_for_ass()
            for style in styles:
                f.write(style + "\n")
            
            f.write("\n[Events]\n")
            f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
            
            # Write dialogue events with appropriate styles
            for i, subtitle in enumerate(subtitle_groups):
                start_time = ass_time(subtitle["start"])
                end_time = ass_time(subtitle["end"])
                text = subtitle["text"].replace('\n', '\\N')
                
                # Determine style name based on speaker
                if subtitle["speaker"] and subtitle["speaker"] in config.speaker_styles:
                    style_name = f"Speaker_{subtitle['speaker']}"
                else:
                    style_name = "Default"
                
                f.write(f"Dialogue: 0,{start_time},{end_time},{style_name},,0,0,0,,{text}\n")

        # Write SRT file if requested
        if config.output_srt and srt_path:
            with open(srt_path, "w", encoding="utf-8") as srt:
                for i, subtitle in enumerate(subtitle_groups, 1):
                    start_time = format_timedelta(timedelta(seconds=subtitle["start"]))
                    end_time = format_timedelta(timedelta(seconds=subtitle["end"]))
                    speaker_prefix = f"[{subtitle['speaker']}] " if subtitle["speaker"] else ""
                    srt.write(f"{i}\n{start_time} --> {end_time}\n{speaker_prefix}{subtitle['text']}\n\n")

        subtitles_path[path] = ass_path

    return subtitles_path


if __name__ == '__main__':
    main()
