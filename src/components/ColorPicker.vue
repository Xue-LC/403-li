<template>
  <div class="cp-wrapper" ref="wrapper">
    <div
      class="cp-preview"
      :style="{ '--cp-color': modelValue }"
      @click.stop="togglePicker"
    ></div>
    <div v-if="showPicker" class="cp-panel" @click.stop>
      <div class="cp-sl" @mousedown="startDragSL" @click="selectSL" ref="slEl" :style="{ '--cp-pure': pureColor }">
        <div class="cp-sl-thumb" :style="{ left: slX + '%', top: slY + '%' }"></div>
      </div>
      <div class="cp-hue" @mousedown="startDragHue" @click="selectHue" ref="hueEl">
        <div class="cp-hue-thumb" :style="{ left: hueX + '%' }"></div>
      </div>
      <div class="cp-alpha-wrap">
        <div class="cp-alpha" @mousedown="startDragAlpha" @click="selectAlpha" ref="alphaEl">
          <div class="cp-alpha-bg"></div>
          <div class="cp-alpha-thumb" :style="{ left: alphaPct + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorPicker',
  props: {
    modelValue: { type: String, default: '#9dff6b' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      showPicker: false,
      hue: 120, sat: 100, val: 100,
      slX: 100, slY: 0, hueX: 33,
      alphaPct: 100,
      dragging: null
    }
  },
  computed: {
    pureColor() {
      const [r, g, b] = this.hsvToRgb(this.hue, 1, 1)
      return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    }
  },
  watch: {
    modelValue(hex) {
      if (!this.dragging && /^#[0-9A-Fa-f]{6,8}$/.test(hex)) {
        this.syncFromHex(hex)
      }
    }
  },
  methods: {
    togglePicker() {
      this.showPicker = !this.showPicker
      if (this.showPicker) this.syncFromHex(this.modelValue)
    },
    closePicker(e) {
      if (this.showPicker && this.$refs.wrapper && !this.$refs.wrapper.contains(e.target)) {
        this.showPicker = false
      }
    },
    onGlobalUp() { this.dragging = null },
    onGlobalMove(e) {
      if (!this.dragging) return
      e.preventDefault()
      const { clientX: x, clientY: y } = e.touches ? e.touches[0] : e
      if (this.dragging === 'sl') this.handleSL(x, y)
      else if (this.dragging === 'hue') this.handleHue(x)
      else if (this.dragging === 'alpha') this.handleAlpha(x)
    },
    startDragSL(e) { this.dragging = 'sl'; this.handleSL(e.clientX, e.clientY) },
    startDragHue(e) { this.dragging = 'hue'; this.handleHue(e.clientX) },
    startDragAlpha(e) { this.dragging = 'alpha'; this.handleAlpha(e.clientX) },
    selectSL(e) { this.handleSL(e.clientX, e.clientY) },
    selectHue(e) { this.handleHue(e.clientX) },
    selectAlpha(e) { this.handleAlpha(e.clientX) },
    handleSL(cx, cy) {
      const rect = this.$refs.slEl.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((cx - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((cy - rect.top) / rect.height) * 100))
      this.slX = x; this.slY = y; this.sat = x; this.val = 100 - y
      this.emitColor()
    },
    handleHue(cx) {
      const rect = this.$refs.hueEl.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((cx - rect.left) / rect.width) * 100))
      this.hueX = x; this.hue = (x / 100) * 360
      this.emitColor()
    },
    handleAlpha(cx) {
      const rect = this.$refs.alphaEl.getBoundingClientRect()
      const a = Math.max(0, Math.min(100, Math.round(((cx - rect.left) / rect.width) * 100)))
      this.alphaPct = a
      this.emitColor()
    },
    emitColor() {
      const [r, g, b] = this.hsvToRgb(this.hue, this.sat / 100, this.val / 100)
      let hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
      if (this.alphaPct < 100) hex += Math.round(this.alphaPct * 255 / 100).toString(16).padStart(2, '0')
      this.$emit('update:modelValue', hex)
    },
    syncFromHex(hex) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      this.alphaPct = hex.length === 9 ? Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) : 100
      const hsv = this.rgbToHsv(r, g, b)
      this.hue = hsv.h; this.sat = hsv.s; this.val = hsv.v
      this.slX = this.sat; this.slY = 100 - this.val
      this.hueX = (this.hue / 360) * 100
    },
    hsvToRgb(h, s, v) {
      const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c
      let r, g, b
      if (h < 60) { r = c; g = x; b = 0 }
      else if (h < 120) { r = x; g = c; b = 0 }
      else if (h < 180) { r = 0; g = c; b = x }
      else if (h < 240) { r = 0; g = x; b = c }
      else if (h < 300) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
    },
    rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
      let h = 0, s = max === 0 ? 0 : d / max, v = max
      if (d !== 0) {
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
          case g: h = ((b - r) / d + 2) * 60; break
          case b: h = ((r - g) / d + 4) * 60; break
        }
      }
      return { h, s: s * 100, v: v * 100 }
    }
  },
  mounted() {
    this.syncFromHex(this.modelValue)
    document.addEventListener('click', this.closePicker)
    document.addEventListener('mousemove', this.onGlobalMove)
    document.addEventListener('mouseup', this.onGlobalUp)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closePicker)
    document.removeEventListener('mousemove', this.onGlobalMove)
    document.removeEventListener('mouseup', this.onGlobalUp)
  }
}
</script>

<style scoped>
.cp-wrapper { position: relative; display: inline-block; }

.cp-preview {
  width: 32px; height: 32px;
  border: 2px solid var(--line);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.cp-preview::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px; z-index: 0;
}
.cp-preview::after { content: ''; position: absolute; inset: 0; background: var(--cp-color); z-index: 1; }

.cp-panel {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 1000;
  background: var(--panel-2); border: 2px solid var(--line);
  padding: 10px; width: 240px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
}

.cp-sl {
  width: 100%; height: 140px;
  border: 2px solid var(--line); position: relative;
  margin-bottom: 10px; cursor: crosshair;
}
.cp-sl::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent, #000),
              linear-gradient(to right, #808080, var(--cp-pure, #ff0000));
  z-index: 0;
}
.cp-sl-thumb {
  position: absolute; width: 12px; height: 12px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5); z-index: 1;
}

.cp-hue {
  width: 100%; height: 14px;
  background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  border: 2px solid var(--line); position: relative;
  margin-bottom: 10px; cursor: pointer;
}
.cp-hue-thumb {
  position: absolute; top: 50%; width: 16px; height: 16px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.cp-alpha-wrap { margin-bottom: 4px; }
.cp-alpha {
  width: 100%; height: 16px;
  border: 2px solid var(--line); position: relative;
  cursor: pointer; overflow: hidden;
  background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}
.cp-alpha-bg { position: absolute; inset: 0; background: linear-gradient(to right, transparent, #000); }
.cp-alpha-thumb {
  position: absolute; top: 50%; width: 18px; height: 18px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

@media (max-width: 640px) {
  .cp-panel { position: fixed; inset: auto 0 0 0; width: auto; margin: 0; }
}
</style>
