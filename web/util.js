const defaultState = {
	style: 'FSCzech', // enum of { FSG, FSA, FSN, FSEast, FSCzech, FSSpain, FSSwitzerland }
	id: null,
	title: null,
	questions: [],
	success: false,
	submitTries: 1,
	submits: 0,
	submitTime: null,
	submitTimer: 0,
	submitInterval: null,
	totalTimer: 0,
	totalInterval: null,
	questionTime: null,
	questionTimer: 0,
	questionInterval: null,
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
		submitTries: 1,
		submitTimeout: null,
		timedQs: false,
		allowQOvertime: false
	},
	'FSG'			: { sequential: true, timedQs: true },
	'FSA'			: { sequential: true, timedQs: true, allowQOvertime: true },
	'FSN'			: { sequential: true },
	'FSEast'		: { sequential: false },
	'FSCzech'		: { sequential: false, submitTries: Infinity, submitTimeout: 30 },
	'FSSpain'		: { sequential: true, submitTries: 3 },
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
			state.questionTime = parseInt(document.getElementById('qTimeField').value)
			break
		case 'FSCzech':
			state.submitTime   = parseInt(document.getElementById('sTOutField').value)
			break
		case 'FSSpain':
			state.submitTries  = parseInt(document.getElementById('sTriesField').value)
			break
	}

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
