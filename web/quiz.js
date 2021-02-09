function showFSATeamCountTroll() {

	var fsatctel = document.getElementById('fsateamcounttroll')
	fsatctel.innerHTML = (state.fsaTeamCountTroll + ' teams have already answered this question')

}

function updateFSATeamCountTroll() {

	if (state.fsaTeamCountTroll > (128*Math.random())) {
		showFSATeamCountTroll()
		return
	}

	// `|| state.submitTime` is a workaround for saved Qs that don't have a time set yet
	var time = state.questions[state.currentQuestion].time || state.submitTime
	var timeratio = 1 - (state.submitTimer / time)
	var slowAnswerChance = Math.random()*2*Math.pow(timeratio, 2)
	var quickAnswerChance = (Math.random()+Math.sqrt(69/time))/4
	var chance = Math.round(slowAnswerChance + quickAnswerChance)
	var magnitude = Math.round((Math.random()/2+timeratio)*6)
	var nt = chance * magnitude
	state.fsaTeamCountTroll += nt

	showFSATeamCountTroll()

}

function updateTotalTimer() {

	var timerEls = document.querySelectorAll('.totaltimer')

	for (timerEl of timerEls)
		timerEl.innerHTML = 'Total time: ' + formatTime(state.totalTimer);

	if (!state.waitNextQuestion)
		state.totalTimer++

	localStorage.setItem('state', JSON.stringify(state))

	if (state.style == 'FSA')
		updateFSATeamCountTroll()

}


function startTotalTimer() {

	console.log('Setting totalTimer to ' + state.totalTimer + ' seconds.')

	updateTotalTimer()

	state.totalInterval = setInterval(updateTotalTimer, 1000)

}

function skipWaitNextQuestion(event) {

	if (!event.ctrlKey || !event.shiftKey)
		return

	console.log('Skipping/Bypassing wait timer')

	state.submitTimer = 0
	updateSubmitTimer()

}

function updateSubmitInfo() {

	var button = document.getElementById('quizSubmitButton')
	var si = document.getElementById('submitinfo')

	if (getRule('submitTimeout') || state.waitNextQuestion) {
		if (state.submitTimer > 0) {
			si.innerHTML = state.waitNextQuestion ? 'Waiting for next question' : 'Wait to retry'
			button.value = 'Wait ' + formatTime(state.submitTimer)
			button.readOnly = true
			button.addEventListener('click', skipWaitNextQuestion)
			return
		}
	}

	si.innerHTML = ''
	button.readOnly = false
	button.removeEventListener('click', skipWaitNextQuestion)

	if (getRule('questionTimeout')) {
		if (state.submitTimer > 0) {
			if (getRule('allowQOvertime'))
				si.innerHTML = ('Losing bonus points in ' + formatTime(state.submitTimer))
			else
				si.innerHTML = ('Forced hand-in in ' + formatTime(state.submitTimer))
		} else {
			if (getRule('allowQOvertime'))
				document.getElementById('submitinfo').innerHTML = 'Bonus points lost.'
		}
	}

	var lastQuestion = (state.currentQuestion == (state.questions.length - 1))

	button.value = lastQuestion || !getRule('sequential') ? 'Submit Answers' : 'Next Question'

}

function updateSubmitTimer() {

	if (state.submitTimer > 0)
		state.submitTimer -= 1

	if (state.submitTimer == 0) {

		clearInterval(state.submitInterval)

		if (getRule('questionTimeout'))
			if (state.waitNextQuestion || !getRule('allowQOvertime'))
				submitQuiz() // Force next question

	}

	updateSubmitInfo()

}


function startSubmitTimer(time) {

	state.submitTimer = time || state.questions[state.currentQuestion].time || state.submitTime
	if (state.submitTimer == null)
		return

	console.log('Setting submitTimer to ' + state.submitTimer + ' seconds.')

	updateSubmitTimer()

	state.submitInterval = setInterval(updateSubmitTimer, 1000)

}


function updateSequentialQuestion() {

	var questions = document.querySelectorAll('.question')
	for (q of questions)
		q.style.display = null

	updateSubmitInfo()

	if (state.currentQuestion !== null && !state.waitNextQuestion) {
		var q = document.querySelector('#quiz form #question' + state.currentQuestion)
		q.style.display = 'block'
	}

}

function nextQuestion() {

	// Save time taken
	state.questions[state.currentQuestion].timeTaken = state.totalTimer - state.questionStartTotalTimer

	// Last question
	if (state.currentQuestion == (state.questions.length - 1)) {
		state.currentQuestion = null
		updateSequentialQuestion()
		return
	}

	// Waiting for next question
	if (getRule('questionTimeout') && (state.submitTimer > 0)) {
		state.waitNextQuestion = true;
		updateSequentialQuestion() // hide question
		return
	}

	state.waitNextQuestion = false

	if (state.style == 'FSA') {
		state.fsaTeamCountTroll = 0
		showFSATeamCountTroll()
	}

	// Start next question
	state.questionStartTotalTimer = state.totalTimer

	state.currentQuestion++

	updateSequentialQuestion()

	if (getRule('questionTimeout'))
		startSubmitTimer()

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
		updateSequentialQuestion()

	if (state.submitTimer > 0)
		startSubmitTimer(state.submitTimer)
	else if (getRule('questionTimeout'))
		startSubmitTimer()
	else
		updateSubmitInfo()

	startTotalTimer()
	state.running = true

	console.log('Quiz started/resumed')

}

function reStartQuiz() {

	console.log('Restarting quiz');

	state.responses					= defaultState.responses
	state.currentQuestion			= defaultState.currentQuestion
	state.waitNextQuestion			= defaultState.waitNextQuestion
	state.success					= defaultState.success
	state.submitTry					= defaultState.submitTry
	state.submitTimer				= defaultState.submitTimer
	state.submitInterval			= defaultState.submitInterval
	state.questionStartTotalTimer	= defaultState.questionStartTotalTimer
	state.totalTimer				= defaultState.totalTimer
	state.totalInterval				= defaultState.totalInterval
	state.fsaTeamCountTroll			= defaultState.fsaTeamCountTroll

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

	//document.querySelector('#quiz form').innerHTML = ''
	changeView('postscreen')

	if (state.submitInterval)
		clearInterval(state.submitInterval)

	clearInterval(state.totalInterval)

	console.log('Quiz ended')

}

function showQuizResults() {

	var quizForm = document.querySelector('#quiz form')
	quizForm.className = ''

	console.log('Showing quiz results...')

	changeView('quiz')

	for (var [idx, value] of state.responses.entries()) {

		console.log(idx + ':', value)
		var el = document.getElementById('question' + idx)

		// Mark question correct or incorrect
		el.classList.add(value.correct ? 'correct' : 'incorrect')

		var q = state.questions[idx]

		// traverse correct answers
		if (state.questions[idx].type == 'Text') {
			for (var [i, ans] of q.answers.entries()) {
				var inp = el.querySelectorAll('input')[i]

				if (inp.value == ans)
					inp.classList.add('right')
				else {
					var note = document.createElement('p')
					note.innerHTML = ans
					inp.parentElement.appendChild(note)
				}
			}
		} else {
			for (var ans of q.answers)
				el.querySelector(`input[value="${ans}"]`).classList.add('trueans')
		}

		var meta = document.createElement('div')
		meta.className = 'meta'
		meta.innerHTML = `
			<p><i>Source/Author: ${q.author || '[No source/author provided]'}</i></p>
			<h5>Explanation:</h5>
			<p>${q.explanation || '[No explanation provided]'}</p>`
		el.appendChild(meta)

		var qinfo = (value.correct) ? '✅ Correct' : '❌ Incorrect'
		if (q.timeTaken) {
			qinfo += ('. Time taken: ' + formatTime(q.timeTaken))
			if (value.correct && getRule('allowQOvertime'))
				qinfo += (', Bonus points ' + ((q.timeTaken <= q.time) ? 'received' : 'lost'))
			else if (q.timeTaken >= (q.time - 1) && !getRule('allowQOvertime'))
				qinfo += ', Time ran out'
		}
		el.querySelector('h3').innerHTML += ` &nbsp; <span class="meta">${qinfo}</span>`

	}

	document.querySelector('#fsateamcounttroll').innerHTML = ''
	document.querySelector('#submitinfo').innerHTML = ''
	document.querySelector('#quizSubmitButton').value = 'Back'

}


function mergeKeyReducer(acc, entry) {

	if (!acc[entry[0]])
		acc[entry[0]] = {answers: [], correct: false}

	acc[entry[0]].answers.push(entry[1])

	return acc

}


function submitQuiz() {

	// If not running, we're most likely in review mode. Just switch back.
	if (state.running == false) {
		changeView('postscreen')
		return
	}

	if (getRule('sequential')) {

		nextQuestion()

		// Not at the end of the quiz yet
		if (state.currentQuestion !== null)
			return

	}

	console.log('Submitting quiz. State:')
	console.log(state)

	var quizForm = document.querySelector('#quiz form')

	var data = new FormData(quizForm)

	var responses = Array.from(data.entries()).reduce(mergeKeyReducer, {})

	console.log(responses)

	var correct = 0
	state.responses = []

	for (var idx = 0; idx < state.questions.length; idx++) {

		var value = responses['q'+idx] || {answers: [], correct: false}

		console.log(idx + ":", value)

		if (state.questions[idx].type == 'ChooseOne' || state.questions[idx].type == 'ChooseAny') {
			state.questions[idx].answers.sort()
			value.answers.sort()
		}

		var correctAnswer = JSON.stringify(state.questions[idx].answers)
		var givenAnswer = JSON.stringify(value.answers)

		console.log('Comparing: ' + givenAnswer + ' == ' + correctAnswer + '?: ' + (givenAnswer == correctAnswer))

		if (givenAnswer == correctAnswer) {
			value.correct = true
			correct++
		}

		state.responses.push(value)

	}

	console.log(state.responses)

	var text = '' + correct + '/' + state.questions.length + ' questions answered correctly.'

	state.success = (correct == state.questions.length)

	if (!state.success) {
		state.submitTry++

		if (getRule('submitTries') && state.submitTry < state.submitTries) {
			alert(text + `\nThis was try ${state.submitTry}/${state.submitTries}\nClick OK to Try Again`)
			renderQuiz()
			if (getRule('sequential')) {
				state.currentQuestion = 0
				updateSequentialQuestion()
			}

			if (getRule('submitTimeout'))
				startSubmitTimer(state.submitTime)
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


function deleteQuiz() {

	clearState()
	removeLink()
	changeView('spreadsheet')

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

		var quiz = await fetchQuiz(urlId)

		state.style = quiz.style
		state.title = quiz.title
		state.questions = quiz.questions
		state.submitTries = quiz.submitTries
		state.submitTime = quiz.submitTime
		state.id = urlId

		// Workaround for quizzes that were saved before the fix
		// Where the stored value is null instead of Infinity
		if (state.style == 'FSCzech')
			state.submitTries = Infinity

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
