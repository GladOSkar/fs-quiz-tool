function updateTotalTimer() {

	var timerEls = document.querySelectorAll('.totaltimer')

	var minutes = Math.floor(state.totalTimer / 60)
	var seconds = state.totalTimer % 60

	var text = minutes + ':' + ('0' + seconds).slice(-2)

	for (timerEl of timerEls)
		timerEl.innerHTML = text

	state.totalTimer++

	localStorage.setItem('state', JSON.stringify(state))

}


function startTotalTimer() {

	console.log('Setting totalTimer to ' + state.totalTimer + ' seconds.')

	updateTotalTimer()

	state.totalInterval = setInterval(updateTotalTimer, 1000)

}

function updateSubmitButton() {

	var button = document.getElementById('quizSubmitButton')

	var lastQuestion = (state.currentQuestion == (state.questions.length - 1))

	button.value = lastQuestion || !getRule('sequential') ? 'Submit Answers' : 'Next Question'

}

function resetSubmitButton() {

	updateSubmitButton()
	document.getElementById('quizSubmitButton').disabled = false

}

function updateSubmitTimer() {

	var button = document.getElementById('quizSubmitButton')

	if (state.submitTimer > 0) {

		timetext = state.submitTimer > 60 ?
			Math.floor(state.submitTimer/60)+':'+(('0' + (state.submitTimer%60)).slice(-2)) :
			state.submitTimer + 's'

		button.value = 'Wait ' + timetext
		button.disabled = true
		state.submitTimer -= 1

	} else {

		resetSubmitButton()
		clearInterval(state.submitInterval)

		if (getRule('sequential') && !getRule('allowQOvertime'))
			submitQuiz()

	}

}


function startSubmitTimer(time) {

	state.submitTimer = time || state.submitTime
	if (state.submitTimer == null)
		return

	console.log('Setting submitTimer to ' + state.submitTimer + ' seconds.')

	updateSubmitTimer()

	state.submitInterval = setInterval(updateSubmitTimer, 1000)

}


function showSequentialQuestion() {

	var questions = document.querySelectorAll('.question')
	for (q of questions)
		q.style.display = null

	updateSubmitButton()

	if (state.currentQuestion !== null) {
		var q = document.querySelector('#quiz form #question' + state.currentQuestion)
		q.style.display = 'block'
	}

}

function nextQuestion() {

	state.currentQuestion++

	if (state.currentQuestion == state.questions.length)
		state.currentQuestion = null

	showSequentialQuestion()

	if (state.currentQuestion !== null && getRule('questionTimeout'))
		startSubmitTimer()

	return state.currentQuestion

}


function renderQuiz() {

	var quizForm = document.querySelector('#quiz form')

	quizForm.className = ''
	if (getRule('sequential'))
		quizForm.classList.add('sequential')

	quizForm.innerHTML = ''

	for (const [i, q] of state.questions.entries()) {

		var html = `<div class="question" id="question${i}">`

		html += `<h3>Question #${i+1}</h3>`
		html += `<h4>${q.question}</h4>`

		if (q.picture)
			html += `<img src="${q.picture}">`

		if (q.type == 'ChooseOne' || q.type == 'ChooseAny') {

			var choices = Array.from(q.choices.entries())
			var shuffled = choices.sort(() => Math.random() - 0.5)

			for ([ci, c] of shuffled)
				html += (q.type == 'ChooseOne')
					? `<label><input type="radio" name="q${i}" value="${ci+1}"> <p>${c}</p></label><br>`
					: `<label><input type="checkbox" name="q${i}" value="${ci+1}"> <p>${c}</p></label><br>`

		} else if (q.type == 'Text') {

			// If choices were given, use them as labels, otherwise use generic label
			for ([ai, a] of q.answers.entries())
				html += `<label>${q.choices[ai] ? q.choices[ai] : 'Answer'}<input type="text" name="q${i}"></label>`

		}

		html += '</div>'

		quizForm.innerHTML += html

	}

}


function startQuiz() {

	state.success = false

	console.log('Starting/Resuming quiz. State:')
	console.log(state)

	renderQuiz()

	changeView('quiz')

	if (getRule('sequential'))
		showSequentialQuestion(state.currentQuestion)

	if (state.submitTimer > 0)
		startSubmitTimer(state.submitTimer)
	else if (getRule('questionTimeout'))
		startSubmitTimer()
	else
		resetSubmitButton()

	startTotalTimer()
	state.running = true

	console.log('Quiz started/resumed')

}

function reStartQuiz() {

	console.log('Restarting quiz');

	state.currentQuestion	= defaultState.currentQuestion
	state.success			= defaultState.success
	state.submitTry			= defaultState.submitTry
	state.submitTimer		= defaultState.submitTimer
	state.submitInterval	= defaultState.submitInterval
	state.totalTimer		= defaultState.totalTimer
	state.totalInterval		= defaultState.totalInterval

	changeView('prescreen')

}


function createQuiz(e) {

	e.preventDefault()

	console.log('Creating new quiz')

	clearState()
	removeLink()

	state.title = document.getElementById('titleField').value
	state.style = document.getElementById('styleField').value

	// After state.style is set
	applyRuleSettingsFromForm()

	if (parseSpreadsheet().success == false) {
		alert('Quiz creation failed.')
		return
	}

	console.log('Spreadsheet parsing successful')

	updateTitles()

	changeView('prescreen')

	console.log('Quiz created:')
	console.log(state)

	return false

}


function endQuiz() {

	console.log('Ending quiz')

	state.running = false

	localStorage.removeItem('state')

	document.querySelector('#quiz form').innerHTML = ''
	changeView('postscreen')

	if (state.submitInterval)
		clearInterval(state.submitInterval)

	clearInterval(state.totalInterval)

	console.log('Quiz ended')

}


function mergeKeyReducer(acc, entry) {

	if (!acc[entry[0]])
		acc[entry[0]] = []

	acc[entry[0]].push(entry[1])

	return acc

}


function submitQuiz() {

	if (getRule('sequential')) {

		var n = nextQuestion()

		if (n !== null)
			return

	}

	console.log('Submitting quiz. State:')
	console.log(state)

	var quizForm = document.querySelector('#quiz form')

	var data = new FormData(quizForm)

	var responses = Array.from(data.entries()).reduce(mergeKeyReducer, {})

	console.log(responses)

	var correct = 0

	for (var [key, value] of Object.entries(responses)) {

		console.log(key + ": " + value)

		// "q3" -> 3
		var idx = key.slice(1)

		if (state.questions[idx].type == 'ChooseOne' || state.questions[idx].type == 'ChooseAny') {
			state.questions[idx].answers.sort()
			value.sort()
		}

		var correctAnswer = JSON.stringify(state.questions[idx].answers)
		var givenAnswer = JSON.stringify(value)

		console.log('Comparing: ' + givenAnswer + ' == ' + correctAnswer + '?: ' + (givenAnswer == correctAnswer))

		if (givenAnswer == correctAnswer)
			correct++

	}

	var text = '' + correct + '/' + state.questions.length + ' questions answered correctly.'

	state.success = (correct == state.questions.length)

	if (!state.success) {
		state.submitTry++

		if (getRule('submitTries') && state.submitTry < state.submitTries) {
			alert(text + `\nThis was try ${state.submitTry}/${state.submitTries}\nClick OK to Try Again`)
			renderQuiz()
			if (getRule('sequential')) {
				state.currentQuestion = 0
				showSequentialQuestion(state.currentQuestion)
			}

			if (getRule('submitTimeout'))
				startSubmitTimer()
		} else {
			document.querySelector('#postscreen h1').innerHTML = (text + '<br>Maybe next time :)')
			endQuiz()
		}
	}

	if (state.success) {
		document.querySelector('#postscreen h1').innerHTML = (text + '<br>Yay you did it!')
		endQuiz()
	}

	console.log('Quiz submitted')

}


function abortQuiz() {

	console.log('Aborting quiz')

	if (!confirm('You sure you want to abort this quiz? Your progress will be lost.'))
		return

	document.querySelector('#postscreen h1').innerHTML = `Quiz cancelled.`

	endQuiz()

	console.log('Quiz cancelled')

}


window.onload = async function() {

	var browserWarning = document.getElementById('browserwarning')

	// If arrow functions are supported, it's modern enough :P
	browserWarning.style.display = (() => 'none')()

	var stateString = localStorage.getItem('state')

	var urlId = idFromUrl()
	console.log('URL ID:', urlId)

	if (stateString) {

		console.log('Loading local state')
		state = JSON.parse(stateString)

	}

	// only fetch if it's a different one
	var useUrl = (urlId && urlId != state.id)
	if (useUrl) {

		console.log('Using remote quiz from url')

		quiz = await fetchQuiz(urlId)
		state.title = quiz.title
		state.questions = quiz.questions
		state.id = urlId

		changeView('prescreen')

	}

	updateTitles()
	var meme = memes[Math.floor(Math.random()*memes.length)]
	document.getElementById('meme').innerHTML = meme

	if (stateString && !useUrl)
		if (state.running)
			startQuiz()
		else
			changeView('prescreen')

	if (!stateString && !useUrl)
		changeView('spreadsheet')

	console.log('onload complete')

}
