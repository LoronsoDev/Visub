'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubtitleConfigType, TranscriptionConfigType } from '@/app/page'
import { SubtitleStyleEditor } from './subtitle-style-editor'

interface SubtitleConfigProps {
  file: File
  subtitleConfig: SubtitleConfigType
  transcriptionConfig: TranscriptionConfigType
  onSubtitleConfigChange: (config: SubtitleConfigType) => void
  onTranscriptionConfigChange: (config: TranscriptionConfigType) => void
  onComplete: () => void
  onJobStart: (jobId: string) => void
}

export function SubtitleConfig({
  file,
  subtitleConfig,
  transcriptionConfig,
  onSubtitleConfigChange,
  onTranscriptionConfigChange,
  onComplete,
  onJobStart
}: SubtitleConfigProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [speakerStyles, setSpeakerStyles] = useState<Record<string, any>>({})
  const [showStyleEditor, setShowStyleEditor] = useState(false)

  const handleStyleChange = (speakerId: string, style: any) => {
    setSpeakerStyles(prev => ({
      ...prev,
      [speakerId]: style
    }))
  }

  const addCustomSpeaker = () => {
    const newSpeakerId = `SPEAKER_${Object.keys(speakerStyles).length.toString().padStart(2, '0')}`
    const defaultStyle = {
      speaker_id: newSpeakerId,
      font_family: 'Impact',
      font_size: 48,
      font_weight: 'bold',
      primary_color: '&H00FFFFFF',
      outline_color: '&H00000000',
      shadow_color: '&H80000000',
      background_color: '&H00000000',
      position: 'bottom_center',
      margin_left: 20,
      margin_right: 20,
      margin_vertical: 40,
      bold: true,
      italic: false,
      underline: false,
      strikeout: false,
      outline_width: 3.0,
      shadow_distance: 2.0,
      text_effect: 'outline',
      letter_spacing: 0.0,
      line_spacing: 1.0,
      scale_x: 100.0,
      scale_y: 100.0,
      rotation: 0.0,
      animation: 'none',
      fade_in_duration: 0.2,
      fade_out_duration: 0.2,
      background_box: false,
      box_padding: 10,
      box_opacity: 0.8,
      border_style: 1,
      all_caps: true,
      word_wrap: true,
      max_line_length: 30
    }
    
    setSpeakerStyles(prev => ({
      ...prev,
      [newSpeakerId]: defaultStyle
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    onComplete()
    
    try {
      const formData = new FormData()
      formData.append('video_file', file)
      
      // Include speaker styles in subtitle config
      const configWithStyles = {
        ...subtitleConfig,
        speakers: Object.values(speakerStyles)
      }
      
      formData.append('subtitle_config', JSON.stringify(configWithStyles))
      formData.append('transcription_config', JSON.stringify(transcriptionConfig))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        onJobStart(result.job_id)
      } else {
        throw new Error(result.detail || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {file.name}</div>
            <div><strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(1)} MB</div>
            <div><strong>Type:</strong> {file.type}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
          <CardDescription>Configure basic subtitle options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum words per subtitle
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={subtitleConfig.max_words}
              onChange={(e) => onSubtitleConfigChange({
                ...subtitleConfig,
                max_words: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableSpeakerDetection"
              checked={subtitleConfig.enable_speaker_detection}
              onChange={(e) => onSubtitleConfigChange({
                ...subtitleConfig,
                enable_speaker_detection: e.target.checked
              })}
            />
            <label htmlFor="enableSpeakerDetection" className="text-sm font-medium">
              Enable Speaker Detection
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Subtitle Styling</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStyleEditor(!showStyleEditor)}
              >
                {showStyleEditor ? 'Hide' : 'Customize'} Styles
              </Button>
            </div>
            
            {showStyleEditor && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Speaker Styles</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomSpeaker}
                    >
                      Add Speaker Style
                    </Button>
                  </div>
                  
                  {Object.keys(speakerStyles).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No custom styles yet.</p>
                      <p className="text-sm">
                        {subtitleConfig.enable_speaker_detection 
                          ? "Speakers will be auto-detected and styled automatically, or add custom styles above."
                          : "Add a custom style or enable speaker detection for automatic styling."
                        }
                      </p>
                    </div>
                  )}
                  
                  {Object.entries(speakerStyles).map(([speakerId, style]) => (
                    <SubtitleStyleEditor
                      key={speakerId}
                      speakerId={speakerId}
                      speakerName={`Speaker ${speakerId.split('_')[1] || '1'}`}
                      style={style}
                      onStyleChange={handleStyleChange}
                      onRemove={() => {
                        setSpeakerStyles(prev => {
                          const newStyles = { ...prev }
                          delete newStyles[speakerId]
                          return newStyles
                        })
                      }}
                    />
                  ))}
                  
                  {/* Additional "Add Speaker Style" button that appears after styles are created */}
                  {Object.keys(speakerStyles).length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomSpeaker}
                        className="w-full"
                      >
                        + Add Another Speaker Style
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="outputSrt"
              checked={subtitleConfig.output_srt}
              onChange={(e) => onSubtitleConfigChange({
                ...subtitleConfig,
                output_srt: e.target.checked
              })}
            />
            <label htmlFor="outputSrt" className="text-sm font-medium">
              Generate SRT file
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Model Settings</CardTitle>
          <CardDescription>Configure transcription quality and language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={transcriptionConfig.model}
              onChange={(e) => onTranscriptionConfigChange({
                ...transcriptionConfig,
                model: e.target.value
              })}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="tiny">Tiny (fastest)</option>
              <option value="base">Base (recommended)</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large-v3">Large V3 (best quality)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={transcriptionConfig.language}
              onChange={(e) => onTranscriptionConfigChange({
                ...transcriptionConfig,
                language: e.target.value
              })}
              className="w-full px-3 py-2 border border-input rounded-md"
            >
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Starting Processing...' : 'Generate Subtitles'}
      </Button>
    </div>
  )
}