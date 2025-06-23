from dataclasses import dataclass, field
from typing import Dict, Optional, List
from enum import Enum
import random

class SubtitlePosition(Enum):
    """Subtitle positioning options for ASS format."""
    BOTTOM_CENTER = 2
    BOTTOM_LEFT = 1
    BOTTOM_RIGHT = 3
    MIDDLE_LEFT = 9
    MIDDLE_CENTER = 5
    MIDDLE_RIGHT = 6
    TOP_LEFT = 7
    TOP_CENTER = 8
    TOP_RIGHT = 9

@dataclass
class SpeakerStyle:
    """Configuration for individual speaker subtitle styling."""
    font_family: str = "Arial"
    font_size: int = 30
    color: str = "&H00FFFFFF"  # White in ASS format
    position: SubtitlePosition = SubtitlePosition.BOTTOM_CENTER
    bold: bool = False
    italic: bool = False
    outline_color: str = "&H00000000"  # Black outline
    shadow_color: str = "&H00000000"  # Black shadow
    outline_width: int = 2
    shadow_distance: int = 2
    
    def to_ass_style(self, style_name: str) -> str:
        """Convert speaker style to ASS format style string."""
        alignment = self.position.value
        bold_flag = 1 if self.bold else 0
        italic_flag = 1 if self.italic else 0
        
        return (
            f"Style: {style_name},{self.font_family},{self.font_size},"
            f"{self.color},&H000000FF,{self.outline_color},{self.shadow_color},"
            f"{bold_flag},{italic_flag},0,0,100,100,0,0,1,"
            f"{self.outline_width},{self.shadow_distance},{alignment},10,10,30,1"
        )

@dataclass 
class SubtitleConfig:
    """Main configuration for subtitle generation."""
    max_words_per_subtitle: int = 4
    min_words_per_subtitle: int = 1
    speaker_styles: Dict[str, SpeakerStyle] = field(default_factory=dict)
    default_style: SpeakerStyle = field(default_factory=SpeakerStyle)
    enable_speaker_detection: bool = False
    output_srt: bool = False
    
    def get_speaker_style(self, speaker_id: Optional[str] = None) -> SpeakerStyle:
        """Get style for a specific speaker, or default if not found."""
        if speaker_id and speaker_id in self.speaker_styles:
            return self.speaker_styles[speaker_id]
        return self.default_style
    
    def add_speaker_style(self, speaker_id: str, style: SpeakerStyle):
        """Add or update a speaker's style configuration."""
        self.speaker_styles[speaker_id] = style
    
    def get_all_styles_for_ass(self) -> List[str]:
        """Generate all ASS style definitions."""
        styles = [self.default_style.to_ass_style("Default")]
        
        for speaker_id, style in self.speaker_styles.items():
            style_name = f"Speaker_{speaker_id}"
            styles.append(style.to_ass_style(style_name))
            
        return styles

def create_default_config() -> SubtitleConfig:
    """Create a default subtitle configuration."""
    return SubtitleConfig(
        max_words_per_subtitle=4,
        min_words_per_subtitle=1,
        default_style=SpeakerStyle(
            font_family="Arial",
            font_size=30,
            color="&H00FFFFFF",
            position=SubtitlePosition.BOTTOM_CENTER
        )
    )

def generate_random_colors(num_speakers: int) -> List[str]:
    """Generate a list of random, distinct colors for speakers in ASS format."""
    colors = [
        "&H000000FF",  # Red
        "&H0000FF00",  # Green  
        "&H00FF0000",  # Blue
        "&H0000FFFF",  # Yellow
        "&H00FF00FF",  # Magenta
        "&H00FFFF00",  # Cyan
        "&H004080FF",  # Orange
        "&H008000FF",  # Purple
        "&H0000FF80",  # Lime
        "&H00FF8000",  # Pink
    ]
    
    # If we need more colors than predefined, generate random ones
    while len(colors) < num_speakers:
        r = random.randint(50, 255)  # Avoid very dark colors
        g = random.randint(50, 255)
        b = random.randint(50, 255)
        ass_color = f"&H00{b:02X}{g:02X}{r:02X}"
        colors.append(ass_color)
    
    return colors[:num_speakers]

def create_auto_speaker_config(detected_speakers: List[str]) -> SubtitleConfig:
    """Create configuration with random colors for detected speakers."""
    config = create_default_config()
    config.enable_speaker_detection = True
    
    if not detected_speakers:
        return config
    
    # Generate random colors for each speaker
    colors = generate_random_colors(len(detected_speakers))
    
    for i, speaker_id in enumerate(detected_speakers):
        style = SpeakerStyle(
            font_family="Arial",
            font_size=32,  # Slightly larger for better visibility
            color=colors[i],
            position=SubtitlePosition.BOTTOM_CENTER,
            bold=True,  # Bold for better visibility
            outline_width=3,  # Thicker outline for contrast
        )
        config.add_speaker_style(speaker_id, style)
        print(f"DEBUG: Assigned {colors[i]} color to {speaker_id}")
    
    return config

def create_multi_speaker_config(speaker_configs: List[Dict]) -> SubtitleConfig:
    """Create configuration for multiple speakers from web interface data.
    
    Args:
        speaker_configs: List of dicts with keys: speaker_id, font_family, 
                        font_size, color, position, bold, italic
    """
    config = create_default_config()
    config.enable_speaker_detection = True
    
    for speaker_config in speaker_configs:
        speaker_id = speaker_config.get('speaker_id', 'default')
        
        # Convert hex color to ASS format if needed
        color = speaker_config.get('color', '#FFFFFF')
        if color.startswith('#'):
            # Convert #RRGGBB to &H00BBGGRR (ASS format)
            hex_color = color[1:]  # Remove #
            if len(hex_color) == 6:
                r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
                ass_color = f"&H00{b}{g}{r}".upper()
            else:
                ass_color = "&H00FFFFFF"  # Default to white
        else:
            ass_color = color
        
        # Convert position string to enum
        position_str = speaker_config.get('position', 'bottom_center').upper()
        try:
            position = SubtitlePosition[position_str]
        except KeyError:
            position = SubtitlePosition.BOTTOM_CENTER
        
        style = SpeakerStyle(
            font_family=speaker_config.get('font_family', 'Arial'),
            font_size=speaker_config.get('font_size', 30),
            color=ass_color,
            position=position,
            bold=speaker_config.get('bold', False),
            italic=speaker_config.get('italic', False)
        )
        
        config.add_speaker_style(speaker_id, style)
    
    return config