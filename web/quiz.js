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


function updateSubmitTimer() {

	var button = document.getElementById('quizSubmitButton')

	if (state.submitTimer > 0) {

		button.value = 'Wait ' + state.submitTimer + 's'
		button.disabled = true
		state.submitTimer -= 1

	} else {

		button.value = 'Submit Answers'
		button.disabled = false
		clearInterval(state.submitInterval)

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


function renderQuiz() {

	var quizForm = document.querySelector('#quiz form')

	quizForm.innerHTML = ''

	for (const [i, q] of state.questions.entries()) {

		var html = ''

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


		quizForm.innerHTML += html

	}

}


function startQuiz() {

	state.success = false

	console.log('Starting/Resuming quiz. State:')
	console.log(state)

	renderQuiz()

	changeView('quiz')

	if (state.submitTimer > 0)
		startSubmitTimer(state.submitTimer)
	else
		updateSubmitTimer()

	startTotalTimer()

	console.log('Quiz started/resumed')

}

function reStartQuiz() {

	console.log('Restarting quiz');

	state.totalTimer = 0
	state.submitTimer = 0
	state.success = false

	startQuiz()

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

	var text = '' + correct + '/' + state.questions.length + ' questions answered correctly.\n'

	state.success = (correct == state.questions.length)

	text += state.success ? 'Yay you did it!' : 'Try again!'

	if (!state.success) {
		renderQuiz()
		startSubmitTimer()
		alert(text)
	}

	if (state.success) {
		document.querySelector('#postscreen h1').innerHTML = `Yay, we're done!<br>Everything is correct :)`
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

	console.log('onload')

	var browserWarning = document.getElementById('browserwarning')

	// If arrow functions are supported, it's modern enough :P
	browserWarning.style.display = (() => 'none')()

	var stateString = localStorage.getItem('state')

	var urlId = idFromUrl()
	console.log('URL ID:' + urlId)

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
		startQuiz()

	if (!stateString && !useUrl)
		changeView('spreadsheet')

	console.log('onload complete')

}
