<template>
  <div class="top top--settings-only">
    <details class="speech-settings">
      <summary><span aria-hidden="true">◉</span> Giọng đọc</summary>
      <div class="speech-settings-menu">
        <div class="voice-controls">
          <label for="voiceSelect">Giọng Mandarin</label>
          <select id="voiceSelect" aria-describedby="voiceStatus" aria-label="Chọn giọng đọc Mandarin">
            <option value="azure:zh-CN-Xiaoxiao:DragonHDFlashLatestNeural">Xiaoxiao Dragon HD Flash</option>
            <option value="azure:zh-CN-Yunyi:DragonHDFlashLatestNeural">Yunyi Dragon HD Flash</option>
          </select>
          <button id="soundTest" class="outline" aria-label="Thử giọng đọc" title="Thử giọng đọc">▶</button>
        </div>
        <div class="speech-style">
          <label for="speechStyleSelect">Tốc độ / ngữ điệu</label>
          <select id="speechStyleSelect" aria-label="Chọn ngữ điệu giọng đọc">
            <option value="natural">Tự nhiên</option>
            <option value="expressive">Biểu cảm</option>
            <option value="clear">Chậm, rõ</option>
          </select>
        </div>
        <p id="voiceStatus" role="status" aria-live="polite">Đang tải danh sách giọng đọc…</p>
      </div>
    </details>
  </div>
</template>
