const defaultState = {
	style: 'FSG',
	id: null,
	title: null,
	running: false,
	questions: [],
	responses: null,
	currentQuestion: 0,
	waitNextQuestion: false,
	success: false,
	submitTry: 0,
	submitTries: 1,
	submitTime: null,
	submitTimer: 0,
	submitInterval: null,
	questionStartTotalTimer: 0,
	totalTimer: 0,
	totalInterval: null,
	fsaTeamCountTroll: 0,
	resultsShown: false
}

var state


function clearState() {

	state = JSON.parse(JSON.stringify(defaultState))

}

clearState()


function updateTitles() {
	document.querySelector('#prescreen h1').innerHTML = state.title || ''
	document.querySelector('#quiz h1').innerHTML = state.title || ''
}


var rules = {
	__default__: {
		sequential: false,
		questionTimeout: null,
		allowQOvertime: false,	// Not implemented correctly
		submitTries: 1,
		submitTimeout: null
	},
	'FSG'			: { sequential: true, questionTimeout: 5 },
	'FSA'			: { sequential: true, questionTimeout: 5, allowQOvertime: true },
	'FSN'			: { sequential: true },
	'FSEast'		: { sequential: false },
	'FSCzech'		: { sequential: false, submitTries: Infinity, submitTimeout: 60 },
	'FSSpain'		: { sequential: true, submitTries: 10 },
	'FSSwitzerland'	: { sequential: true },
}

function getRule(name) {

	var r = rules[state.style]

	if (r.hasOwnProperty(name))
		return r[name]

	var d = rules.__default__
	if (d.hasOwnProperty(name))
		return d[name]

	console.error('No such rule:', name);

	return undefined

}

function applyRuleSettingsFromForm() {

	switch (state.style) {
		case 'FSG':
		case 'FSA':
			state.submitTime  = 60 * parseInt(document.getElementById('qTimeField').value)
			break
		case 'FSCzech':
			state.submitTime  = parseInt(document.getElementById('sTOutField').value)
			state.submitTries = rules[state.style].submitTries
			break
		case 'FSSpain':
			state.submitTries = parseInt(document.getElementById('sTriesField').value)
			break
	}

}


function formatTime(seconds) {
	return (seconds > 60)
		? Math.floor(seconds / 60) + ':' + (('0' + (seconds % 60)).slice(-2))
		: seconds + 's'
}


function changeView(view) {

	for (el of document.querySelectorAll('.view'))
		el.style.display = 'none'

	document.getElementById(view).style.display = 'block'

}


const memes = [
	"GE-SUND-BRUN-NEN-CENTER!",
	"Deine Mudda! Berlin!",
	"Eine Runde Kicker?",
	"Hulkdrian!",
	"Jetz' bin i' wieda doa",
	"Mmmmh Carbonstaub",
	"#würthshausfranz",
	"#berlinerluft",
	"FaST<b>TUBe</b>, not Fast<b>COQUE</b>",
	"Yes, we CAN",
	"Ist in der Cloud.",
	"Ist im Wiki.",
	"Ich liiebe Teamcenter <3",
	"Podio kann alles!",
	"Let's build 3 fucking racecars!",
	"Der Fahrstuhl ist kaputt",
	"Frau Ipta reißt euch den Kopf ab!",
	"Max, Max, Max, Max, Max, Max, MaxMax!",
	"Julian, Anwärter, Firewall",
	"Diese Webseite ist geerdet.",
	"Wer AMS sagt muss auch BMS sagen",
	"Ist der Kabelbinder in der BOM?",
	"*Fistbump*",
	"Nividia!",
	"Ihr schafft das! :)",
	"Klotzen, nicht kleckern!",
	"*revving noises*",
	"Resistance is futile",
	"Jan schweißt das noch",
	"Would Claude approve of this?",
	"Im CAD hat's noch gepasst",
	"¯\\_(ツ)_/¯",
	"AMK Brudi",
	"Mmmhh cones",
	"Best viewed in Netscape Navigator 1.22",
]
