'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SubtitleConfigType, TranscriptionConfigType } from '@/app/page'

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    onComplete()
    
    try {
      const formData = new FormData()
      formData.append('video_file', file)
      formData.append('subtitle_config', JSON.stringify(subtitleConfig))
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