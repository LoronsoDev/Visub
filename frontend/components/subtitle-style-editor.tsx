'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Types for styling configuration
interface SpeakerStyle {
  speaker_id: string
  font_family: string
  font_size: number
  font_weight: string
  primary_color: string
  outline_color: string
  shadow_color: string
  background_color: string
  position: string
  margin_left: number
  margin_right: number
  margin_vertical: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikeout: boolean
  outline_width: number
  shadow_distance: number
  text_effect: string
  letter_spacing: number
  line_spacing: number
  scale_x: number
  scale_y: number
  rotation: number
  animation: string
  fade_in_duration: number
  fade_out_duration: number
  background_box: boolean
  box_padding: number
  box_opacity: number
  border_style: number
  all_caps: boolean
  word_wrap: boolean
  max_line_length: number
  enable_word_highlighting: boolean
  highlight_color: string
  highlight_outline_color: string
  highlight_bold: boolean
}

interface StyleResources {
  fonts: Array<{value: string, label: string, category: string}>
  effects: Array<{value: string, label: string}>
  animations: Array<{value: string, label: string}>
  positions: Array<{value: string, label: string}>
  colors: Array<{value: string, label: string, hex: string}>
  presets: Record<string, {
    name: string
    description: string
    preview: Partial<SpeakerStyle>
  }>
}

interface SubtitleStyleEditorProps {
  speakerId: string
  speakerName: string
  style: SpeakerStyle
  onStyleChange: (speakerId: string, style: SpeakerStyle) => void
  onRemove?: () => void
}

export function SubtitleStyleEditor({ 
  speakerId, 
  speakerName, 
  style, 
  onStyleChange, 
  onRemove 
}: SubtitleStyleEditorProps) {
  const [resources, setResources] = useState<StyleResources | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'effects' | 'presets'>('basic')
  const [previewText, setPreviewText] = useState('Sample subtitle text')

  useEffect(() => {
    // Load styling resources from API
    const loadResources = async () => {
      try {
        const [fonts, effects, animations, positions, colors, presets] = await Promise.all([
          fetch('/api/fonts').then(r => r.json()),
          fetch('/api/effects').then(r => r.json()),
          fetch('/api/animations').then(r => r.json()),
          fetch('/api/positions').then(r => r.json()),
          fetch('/api/colors').then(r => r.json()),
          fetch('/api/presets').then(r => r.json())
        ])

        setResources({
          fonts: fonts.fonts || [],
          effects: effects.effects || [],
          animations: animations.animations || [],
          positions: positions.positions || [],
          colors: colors.colors || [],
          presets: presets.presets || {}
        })
      } catch (error) {
        console.error('Failed to load styling resources:', error)
      }
    }

    loadResources()
  }, [])

  const updateStyle = (updates: Partial<SpeakerStyle>) => {
    const newStyle = { ...style, ...updates }
    onStyleChange(speakerId, newStyle)
  }

  const applyPreset = (presetKey: string) => {
    if (!resources?.presets[presetKey]) return
    
    const preset = resources.presets[presetKey].preview
    updateStyle({
      font_family: preset.font_family || style.font_family,
      font_size: preset.font_size || style.font_size,
      primary_color: preset.primary_color || style.primary_color,
      outline_color: preset.outline_color || style.outline_color,
      text_effect: preset.text_effect || style.text_effect,
      all_caps: preset.all_caps ?? style.all_caps,
      bold: preset.bold ?? style.bold
    })
  }

  const getStylePreview = () => {
    // Map font family names to CSS font stacks with fallbacks
    const getFontStack = (fontFamily: string) => {
      const fontMap: Record<string, string> = {
        'Impact': 'Impact, "Franklin Gothic Bold", "Helvetica Inserat", "Bitstream Vera Sans Bold", "Arial Black", sans-serif',
        'Arial Black': '"Arial Black", "Arial Bold", Gadget, sans-serif',
        'Bebas Neue': '"Bebas Neue", "League Gothic", "Oswald", "Arial Narrow", Arial, sans-serif',
        'Montserrat Black': '"Montserrat", "Proxima Nova", "Helvetica Neue", Arial, sans-serif',
        'Oswald': '"Oswald", "Arial Narrow", Arial, sans-serif',
        'Roboto Black': '"Roboto", "Droid Sans", Arial, sans-serif',
        'Anton': '"Anton", "Bebas Neue", "Arial Black", Arial, sans-serif',
        'Barlow': '"Barlow", "Open Sans", Arial, sans-serif',
        'Lato Black': '"Lato", "Helvetica Neue", Arial, sans-serif',
        'Open Sans': '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
        'Nunito Black': '"Nunito", "Source Sans Pro", Arial, sans-serif',
        'Arial': 'Arial, Helvetica, sans-serif',
        'Helvetica': 'Helvetica, Arial, sans-serif'
      }
      return fontMap[fontFamily] || fontFamily + ', Arial, sans-serif'
    }

    const outlineColor = assColorToHex(style.outline_color)
    const shadowColor = assColorToHex(style.shadow_color)
    
    // Create text shadow based on effect type
    let textShadow = ''
    switch (style.text_effect) {
      case 'outline':
        textShadow = `
          -1px -1px 0 ${outlineColor},
          1px -1px 0 ${outlineColor},
          -1px 1px 0 ${outlineColor},
          1px 1px 0 ${outlineColor},
          0 0 4px ${outlineColor}
        `
        break
      case 'glow':
        textShadow = `
          0 0 5px ${outlineColor},
          0 0 10px ${outlineColor},
          0 0 15px ${outlineColor}
        `
        break
      case 'shadow':
        textShadow = `${style.shadow_distance}px ${style.shadow_distance}px 4px ${shadowColor}`
        break
      case 'outline_glow':
        textShadow = `
          -1px -1px 0 ${outlineColor},
          1px -1px 0 ${outlineColor},
          -1px 1px 0 ${outlineColor},
          1px 1px 0 ${outlineColor},
          0 0 8px ${outlineColor}
        `
        break
      case 'double_outline':
        textShadow = `
          -2px -2px 0 ${outlineColor},
          2px -2px 0 ${outlineColor},
          -2px 2px 0 ${outlineColor},
          2px 2px 0 ${outlineColor},
          -1px -1px 0 ${outlineColor},
          1px -1px 0 ${outlineColor},
          -1px 1px 0 ${outlineColor},
          1px 1px 0 ${outlineColor}
        `
        break
      case 'drop_shadow':
        textShadow = `
          -1px -1px 0 ${outlineColor},
          1px -1px 0 ${outlineColor},
          -1px 1px 0 ${outlineColor},
          1px 1px 0 ${outlineColor},
          ${style.shadow_distance}px ${style.shadow_distance}px 8px ${shadowColor}
        `
        break
      default:
        textShadow = `2px 2px 4px ${outlineColor}`
    }

    return {
      fontFamily: getFontStack(style.font_family),
      fontSize: `${Math.max(16, style.font_size * 0.4)}px`,
      fontWeight: style.bold ? '900' : style.font_weight || 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      color: assColorToHex(style.primary_color),
      textShadow: textShadow.replace(/\s+/g, ' ').trim(),
      textTransform: (style.all_caps ? 'uppercase' : 'none') as 'none' | 'uppercase',
      letterSpacing: `${style.letter_spacing}px`,
      lineHeight: style.line_spacing,
      transform: `scale(${style.scale_x / 100}, ${style.scale_y / 100}) rotate(${style.rotation}deg)`,
      textDecoration: [
        style.underline ? 'underline' : '',
        style.strikeout ? 'line-through' : ''
      ].filter(Boolean).join(' ') || 'none',
      WebkitTextStroke: style.text_effect === 'outline' ? `${style.outline_width * 0.5}px ${outlineColor}` : 'none',
      backgroundColor: style.background_box ? `${assColorToHex(style.background_color)}${Math.round(style.box_opacity * 255).toString(16).padStart(2, '0')}` : 'transparent',
      padding: style.background_box ? `${style.box_padding}px` : '0',
      borderRadius: style.background_box ? '4px' : '0'
    }
  }

  const assColorToHex = (assColor: string): string => {
    // Handle transparent/invisible color
    if (assColor === 'transparent' || assColor === '&H00000000' || assColor === '') {
      return 'transparent'
    }
    
    if (assColor.startsWith('&H')) {
      // Extract BGR values from format &H00BBGGRR
      const hexPart = assColor.slice(2) // Remove &H
      if (hexPart.length >= 8) {
        // Skip alpha (first 2 chars) and get BGR values
        const alpha = hexPart.slice(0, 2)
        const b = parseInt(hexPart.slice(2, 4), 16)
        const g = parseInt(hexPart.slice(4, 6), 16) 
        const r = parseInt(hexPart.slice(6, 8), 16)
        return `rgb(${r}, ${g}, ${b})`
      } else if (hexPart.length >= 6) {
        // Handle format without alpha
        const b = parseInt(hexPart.slice(0, 2), 16)
        const g = parseInt(hexPart.slice(2, 4), 16)
        const r = parseInt(hexPart.slice(4, 6), 16)
        return `rgb(${r}, ${g}, ${b})`
      }
    }
    return '#ffffff'
  }

  // Load Google Fonts and test system fonts when component mounts
  useEffect(() => {
    // Load Google Fonts for better typography
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Oswald:wght@200;300;400;500;600;700&family=Roboto:wght@100;300;400;500;700;900&family=Anton:wght@400&family=Barlow:wght@100;200;300;400;500;600;700;800;900&family=Lato:wght@100;300;400;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap'
    link.rel = 'stylesheet'
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link)
    }

    // Add fallback web fonts for Impact if system font is not available
    const style = document.createElement('style')
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton:wght@400&family=Oswald:wght@700&family=Bebas+Neue:wght@400&display=swap');
      
      .impact-fallback {
        font-family: Impact, Anton, "Bebas Neue", "Arial Narrow", "Arial Black", sans-serif-condensed, sans-serif !important;
        font-weight: 900 !important;
        font-stretch: condensed !important;
      }
      
      .arial-black-fallback {
        font-family: "Arial Black", "Arial Bold", Anton, "Bebas Neue", Gadget, sans-serif !important;
        font-weight: 900 !important;
      }
    `
    if (!document.querySelector('style[data-font-fallbacks]')) {
      style.setAttribute('data-font-fallbacks', 'true')
      document.head.appendChild(style)
    }

    // Test font availability and force browser recognition
    const testSystemFonts = () => {
      const testFonts = ['Impact', 'Arial Black', 'Helvetica']
      const testText = 'ABCDEFabcdef123'
      const testSize = '72px'
      
      testFonts.forEach(fontName => {
        const testDiv = document.createElement('div')
        testDiv.style.fontFamily = `${fontName}, monospace`
        testDiv.style.fontSize = testSize
        testDiv.style.fontWeight = 'bold'
        testDiv.style.visibility = 'hidden'
        testDiv.style.position = 'absolute'
        testDiv.style.top = '-1000px'
        testDiv.textContent = testText
        document.body.appendChild(testDiv)
        
        // Get computed style to force font loading
        const computed = window.getComputedStyle(testDiv)
        const actualFont = computed.fontFamily
        
        console.log(`Font test for ${fontName}: ${actualFont}`)
        
        setTimeout(() => {
          if (document.body.contains(testDiv)) {
            document.body.removeChild(testDiv)
          }
        }, 200)
      })
    }
    
    // Run font test after a delay to ensure fonts are loaded
    setTimeout(testSystemFonts, 500)
  }, [])

  if (!resources) {
    return <div className="p-4">Loading styling options...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{speakerName}</CardTitle>
            <CardDescription>Customize subtitle styling for this speaker</CardDescription>
          </div>
          {onRemove && (
            <Button variant="outline" size="sm" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Style Preview */}
        <div className="border rounded-lg p-6 bg-gray-600 text-center relative overflow-hidden">
          <div 
            style={getStylePreview()}
            className="mb-4 min-h-[60px] flex items-center justify-center"
          >
            {previewText}
          </div>
          <input
            type="text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="px-3 py-1 text-sm border rounded bg-white text-black w-full max-w-xs"
            placeholder="Edit preview text..."
          />
          <div className="mt-1 text-xs text-gray-300">
            Font: {style.font_family} • Size: {style.font_size}px • Effect: {style.text_effect.replace('_', ' ')}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b">
          {[
            { key: 'presets', label: 'Presets' },
            { key: 'basic', label: 'Basic' },
            { key: 'advanced', label: 'Advanced' },
            { key: 'effects', label: 'Effects' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.key 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Viral Video Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(resources.presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="p-3 border rounded-lg hover:border-blue-500 text-left transition-colors"
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Font Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                {resources.fonts.map(font => {
                  const getFontStyle = (fontName: string) => {
                    const fontMap: Record<string, string> = {
                      'Impact': 'Impact, "Arial Narrow", "Franklin Gothic Bold", "Helvetica Inserat", sans-serif-condensed, sans-serif',
                      'Arial Black': '"Arial Black", "Arial Bold", Gadget, "Trebuchet MS Bold", sans-serif',
                      'Bebas Neue': '"Bebas Neue", "League Gothic", "Oswald", "Arial Narrow Bold", Impact, sans-serif',
                      'Montserrat Black': '"Montserrat", "Montserrat Black", "Proxima Nova", "Helvetica Neue", Arial, sans-serif',
                      'Oswald': '"Oswald", "Arial Narrow", "Helvetica Condensed", Arial, sans-serif',
                      'Roboto Black': '"Roboto", "Roboto Black", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
                      'Anton': '"Anton", "Bebas Neue", Impact, "Arial Black", sans-serif',
                      'Barlow': '"Barlow", "Barlow Black", "Open Sans", "Helvetica Neue", Arial, sans-serif',
                      'Lato Black': '"Lato", "Lato Black", "Helvetica Neue", "Open Sans", Arial, sans-serif',
                      'Open Sans': '"Open Sans", "Open Sans Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
                      'Nunito Black': '"Nunito", "Nunito Black", "Source Sans Pro", "Open Sans", Arial, sans-serif',
                      'Arial': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                      'Helvetica': 'Helvetica, "Helvetica Neue", Arial, sans-serif'
                    }
                    return fontMap[fontName] || fontName + ', Arial, sans-serif'
                  }

                  return (
                    <button
                      key={font.value}
                      onClick={() => updateStyle({ font_family: font.label })}
                      className={`p-2 border rounded text-center transition-all hover:border-blue-500 hover:shadow-sm ${
                        style.font_family === font.label 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                          : 'border-gray-300'
                      }`}
                      style={{ 
                        fontFamily: getFontStyle(font.label),
                        fontWeight: font.label.includes('Black') || font.label === 'Impact' || font.label === 'Anton' || font.label === 'Bebas Neue' ? '900' : '700',
                        fontStretch: font.label === 'Impact' || font.label === 'Bebas Neue' ? 'condensed' : 'normal'
                      }}
                    >
                      <div className="text-sm leading-tight">{font.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Font Size and Outline Width */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Font Size: {style.font_size}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={style.font_size}
                  onChange={(e) => updateStyle({ font_size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Outline Width: {style.outline_width}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={style.outline_width}
                  onChange={(e) => updateStyle({ outline_width: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <div className="flex flex-wrap gap-1">
                  {/* Transparent option */}
                  <button
                    onClick={() => updateStyle({ primary_color: 'transparent' })}
                    className={`w-6 h-6 rounded border-2 bg-white relative ${
                      style.primary_color === 'transparent' ? 'border-black ring-1 ring-blue-400' : 'border-gray-300'
                    }`}
                    title="Transparent (invisible text)"
                  >
                    <div className="absolute inset-0.5 bg-gradient-to-br from-red-500 to-red-500 opacity-50"></div>
                    <div className="absolute inset-0.5 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-red-500 transform rotate-45"></div>
                    </div>
                  </button>
                  {resources.colors.slice(0, 5).map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateStyle({ primary_color: color.value })}
                      className={`w-6 h-6 rounded border-2 ${
                        style.primary_color === color.value ? 'border-black ring-1 ring-blue-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Outline Color</label>
                <div className="flex flex-wrap gap-1">
                  {/* Transparent option */}
                  <button
                    onClick={() => updateStyle({ outline_color: 'transparent' })}
                    className={`w-6 h-6 rounded border-2 bg-white relative ${
                      style.outline_color === 'transparent' ? 'border-black ring-1 ring-blue-400' : 'border-gray-300'
                    }`}
                    title="Transparent (no outline)"
                  >
                    <div className="absolute inset-0.5 bg-gradient-to-br from-red-500 to-red-500 opacity-50"></div>
                    <div className="absolute inset-0.5 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-red-500 transform rotate-45"></div>
                    </div>
                  </button>
                  {resources.colors.slice(5).map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateStyle({ outline_color: color.value })}
                      className={`w-6 h-6 rounded border-2 ${
                        style.outline_color === color.value ? 'border-black ring-1 ring-blue-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Position and Text Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select
                  value={style.position}
                  onChange={(e) => updateStyle({ position: e.target.value })}
                  className="w-full px-2 py-1 pr-6 text-sm border border-input rounded"
                >
                  {resources.positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Text Style</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={style.bold}
                      onChange={(e) => updateStyle({ bold: e.target.checked })}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Bold</span>
                  </label>
                  
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={style.italic}
                      onChange={(e) => updateStyle({ italic: e.target.checked })}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Italic</span>
                  </label>
                  
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={style.all_caps}
                      onChange={(e) => updateStyle({ all_caps: e.target.checked })}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">CAPS</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Scaling */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Width Scale: {style.scale_x}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={style.scale_x}
                  onChange={(e) => updateStyle({ scale_x: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Height Scale: {style.scale_y}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={style.scale_y}
                  onChange={(e) => updateStyle({ scale_y: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Spacing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Letter Spacing: {style.letter_spacing}px
                </label>
                <input
                  type="range"
                  min="-5"
                  max="10"
                  step="0.5"
                  value={style.letter_spacing}
                  onChange={(e) => updateStyle({ letter_spacing: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Line Spacing: {style.line_spacing}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={style.line_spacing}
                  onChange={(e) => updateStyle({ line_spacing: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Rotation: {style.rotation}°
              </label>
              <input
                type="range"
                min="-15"
                max="15"
                value={style.rotation}
                onChange={(e) => updateStyle({ rotation: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Margins */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Margin</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={style.margin_left}
                  onChange={(e) => updateStyle({ margin_left: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Right Margin</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={style.margin_right}
                  onChange={(e) => updateStyle({ margin_right: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Vertical Margin</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={style.margin_vertical}
                  onChange={(e) => updateStyle({ margin_vertical: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            {/* Text Effect */}
            <div>
              <label className="block text-sm font-medium mb-2">Text Effect</label>
              <select
                value={style.text_effect}
                onChange={(e) => updateStyle({ text_effect: e.target.value })}
                className="w-full px-3 py-2 pr-8 border border-input rounded-md"
              >
                {resources.effects.map(effect => (
                  <option key={effect.value} value={effect.value}>
                    {effect.label}
                  </option>
                ))}
              </select>
            </div>


            {/* Shadow Distance */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Shadow Distance: {style.shadow_distance}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={style.shadow_distance}
                onChange={(e) => updateStyle({ shadow_distance: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Background Box */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={style.background_box}
                  onChange={(e) => updateStyle({ background_box: e.target.checked })}
                />
                <span className="text-sm">Background Box</span>
              </label>
              
              {style.background_box && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Box Opacity: {Math.round(style.box_opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={style.box_opacity}
                      onChange={(e) => updateStyle({ box_opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Box Padding</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={style.box_padding}
                      onChange={(e) => updateStyle({ box_padding: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Animation */}
            <div>
              <label className="block text-sm font-medium mb-2">Animation</label>
              <select
                value={style.animation}
                onChange={(e) => updateStyle({ animation: e.target.value })}
                className="w-full px-3 py-2 pr-8 border border-input rounded-md"
              >
                {resources.animations.map(anim => (
                  <option key={anim.value} value={anim.value}>
                    {anim.label}
                  </option>
                ))}
              </select>
              {style.animation !== 'none' && style.enable_word_highlighting && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                  <strong>Tip:</strong> Animation plays once when the subtitle appears, then word highlighting takes over for the karaoke effect.
                </div>
              )}
            </div>

            {/* Word Highlighting (Karaoke) */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700">Word Highlighting (Karaoke Style)</h4>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={style.enable_word_highlighting}
                  onChange={(e) => updateStyle({ enable_word_highlighting: e.target.checked })}
                />
                <span className="text-sm">Enable word-by-word highlighting</span>
              </label>
              
              {style.enable_word_highlighting && style.animation !== 'none' && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  <strong>Perfect combo!</strong> Your subtitle will animate in with &quot;{style.animation.replace('_', ' ')}&quot; and then highlight each word as it&apos;s spoken.
                </div>
              )}

              {style.enable_word_highlighting && (
                <div className="ml-6 space-y-4">
                  {/* Highlight Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Highlight Color</label>
                    <div className="flex flex-wrap gap-1">
                      {resources.colors.map(color => (
                        <button
                          key={color.value}
                          onClick={() => updateStyle({ highlight_color: color.value })}
                          className={`w-6 h-6 rounded border-2 ${
                            style.highlight_color === color.value ? 'border-black ring-1 ring-blue-400' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Highlight Style Options */}
                  <div>
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={style.highlight_bold}
                        onChange={(e) => updateStyle({ highlight_bold: e.target.checked })}
                      />
                      <span className="text-sm">Bold highlighted words</span>
                    </label>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}