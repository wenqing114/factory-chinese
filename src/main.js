import { createApp } from 'vue'
import studyData from './data/studyData.js'
import App from './App.vue'
import './styles/style.css'
import './styles/modern.css'
import './styles/cute.css'
import './styles/dictionary.css'
import './styles/navshsk-inspired.css'
import './styles/grammar.css'

window.STUDY_DATA = studyData

createApp(App).mount('#root')
