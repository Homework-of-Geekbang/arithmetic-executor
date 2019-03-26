const buttonEl = document.getElementById('calc')
const resultEl = document.getElementById('result')
const inputEl = document.getElementById('input')
const answerEl = document.getElementById('answer')

buttonEl.addEventListener('click', run)

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    run()
  }
})

function run () {
  if (!inputEl.value.trim()) return
  resultEl.textContent = window.executor(inputEl.value) || ''
  answerEl.textContent = eval(inputEl.value)
}
