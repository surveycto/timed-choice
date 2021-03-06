/* global fieldProperties, setAnswer, goToNextField, getPluginParameter, getMetaData, setMetaData */

// Start standard field setup
var choices = fieldProperties.CHOICES
var appearance = fieldProperties.APPEARANCE
var fieldType = fieldProperties.FIELDTYPE
var numChoices = choices.length

var labelContainer = document.querySelector('#label')
var hintContainer = document.querySelector('#hint')

var choiceContainers // Will eventually contain all choice containers, either from no appearance, or 'list-nolabel' appearance
var radioButtonsContainer = document.querySelector('#radio-buttons-container') // default radio buttons
var selectDropDownContainer = document.querySelector('#select-dropdown-container') // minimal appearance
var likertContainer = document.querySelector('#likert-container') // likert
var choiceLabelContainer = document.querySelector('#choice-labels')
var listNoLabelContainer = document.querySelector('#list-nolabel')

var labelOrLnl

// Start timer fields
var timerContainer = document.querySelector('#timer-container')
var timerDisp = timerContainer.querySelector('#timerdisp')
var unitDisp = timerContainer.querySelector('#unitdisp')

// PARAMETERS
var dispTimer = getPluginParameter('disp')
var timeStart = getPluginParameter('duration')
var unit = getPluginParameter('unit')
var missed = getPluginParameter('pass')
var autoAdvance = getPluginParameter('advance')
var block = getPluginParameter('block')
var nochange = getPluginParameter('nochange')
var metadata = getMetaData()
var leftoverTime

// Time and other vars
var startTime // This will get an actual value when the timer starts in startStopTimer()
var round = 1000 // Default, may be changed
var timeLeft // Starts this way for the display.
var timePassed = 0 // Time passed so far
var complete = false
var currentAnswer
var allChoices = []

// Default parameter values
// Setup defaults of parameters if they are not defined
if (dispTimer === 0) {
  dispTimer = false
  timerContainer.parentElement.removeChild(timerContainer)
} else {
  dispTimer = true
}

if ((timeStart == null) || isNaN(timeStart)) {
  timeStart = 10000 // Default time 10,000 ms (10 seconds)
} else {
  timeStart *= 1000
}

// Timing calculations
if (unit === 'ms') {
  round = 1
} else if (unit === 'cs') {
  round = 10
} else if (unit === 'ds') {
  round = 100
} else {
  unit = 's'
  round = 1000
}
unitDisp.innerHTML = unit

if (missed == null) {
  missed = '-99'
} else {
  missed = String(missed)
}

if ((autoAdvance === 0) || ((!dispTimer) && (autoAdvance !== 1))) {
  autoAdvance = false
} else {
  autoAdvance = true
}

if (block === 0) {
  block = false
} else {
  block = true
}

if (nochange === 1) {
  nochange = true
} else {
  nochange = false
}

// End default parameters

// Check to make sure "pass" value is a choice value
for (var c = 0; c < numChoices; c++) {
  var choice = choices[c]
  allChoices.push(choice.CHOICE_VALUE)
}
if (allChoices.indexOf(missed) === -1) {
  var errorMessage = missed + ' is not specified as a choice value. Please add a choice with ' + missed + ' as a choice value, or this field plug-in will not work.'
  document.querySelector('#error').innerHTML = 'Error: ' + errorMessage
} else {
  if (appearance.indexOf('label') === -1) { // Check if it has the "label" or "list-nolabel" appearance
    labelOrLnl = false
  } else {
    labelOrLnl = true
  }

  if (labelOrLnl) {
    choiceContainers = document.querySelectorAll('.fl-radio') // Go through all  the available choices of 'list-nolabel'
  } else {
    choiceContainers = document.querySelectorAll('.choice-container') // go through all the available choices
  }

  if (!labelOrLnl) {
    if (fieldProperties.LABEL) {
      labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
    }
    if (fieldProperties.HINT) {
      hintContainer.innerHTML = unEntity(fieldProperties.HINT)
    }
  }

  // Prepare the current webview, making adjustments for any appearance options
  if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) { // minimal appearance
    removeContainer('minimal')
    selectDropDownContainer.style.display = 'block' // show the select dropdown
  } else if (appearance.indexOf('list-nolabel') !== -1) { // list-nolabel appearance
    removeContainer('nolabel')
    labelContainer.parentElement.removeChild(labelContainer)
    hintContainer.parentElement.removeChild(hintContainer)
  } else if (labelOrLnl) { // If 'label' appearance
    removeContainer('label')
    labelContainer.parentElement.removeChild(labelContainer)
    hintContainer.parentElement.removeChild(hintContainer)
  } else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
    removeContainer('likert')
    likertContainer.style.display = 'flex' // show the likert container

    // likert-min appearance
    if (appearance.indexOf('likert-min') !== -1) {
      var likertChoices = document.querySelectorAll('.likert-choice-container')
      for (var i = 1; i < likertChoices.length - 1; i++) {
        likertChoices[i].querySelector('.likert-choice-label').style.display = 'none' // hide all choice labels except the first and last
      }
      likertChoices[0].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-first') // apply a special class to the first choice label
      likertChoices[likertChoices.length - 1].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-last') // apply a special class to the last choice label
    }
    var likertButtons = document.querySelectorAll('div[name="opt"]')
    var numLikert = likertButtons.length
  } else { // all other appearances
    removeContainer('radio')
    if (fieldProperties.LANGUAGE !== null && isRTL(fieldProperties.LANGUAGE)) {
      radioButtonsContainer.dir = 'rtl'
    }

    // quick appearance
    if ((appearance.indexOf('quick') !== -1) && (fieldType === 'select_one')) {
      for (var i = 0; i < choiceContainers.length; i++) {
        choiceContainers[i].classList.add('appearance-quick') // add the 'appearance-quick' class
        choiceContainers[i].querySelectorAll('.choice-label-text')[0].insertAdjacentHTML('beforeend', '<svg class="quick-appearance-icon"><use xlink:href="#quick-appearance-icon" /></svg>') // insert the 'quick' icon
      }
    }
  }

  // Removes the "missed" value as a visible choice
  var passTd = document.querySelector('#choice-' + missed)
  passTd.parentElement.removeChild(passTd) // Remove the pass value as a label

  // Retrieves the button info now that all of the unneeded ones have been removed
  var allButtons = document.querySelectorAll('input[name="opt"]') // This is declared here so the unneeded boxes have already been removed.
  var numButtons = allButtons.length

  if (metadata != null) { // Move on if there is already a value
    metadata = metadata.match(new RegExp('[^ ]+', 'g'))
    leftoverTime = parseInt(metadata[0])
    var lastTimeStamp = parseInt(metadata[1])
    var timeSinceLast = Date.now() - lastTimeStamp
    leftoverTime = leftoverTime - timeSinceLast
    if (leftoverTime <= 0) { // If time has run out, then block, auto-advance, and set to missed value if applicable
      leftoverTime = 0
      complete = true
      blockInput()

      if (!checkComplete()) { // If the field does not have a value, but time has run out, then set to "missed" value.
        setAnswer(missed)
      }

      if (autoAdvance) {
        goToNextField()
      }
    } // End time has run out
  } // End metadata not blank

  // Changes checkboxes to radio buttons if select_one
  if (fieldType === 'select_one') { // Changes input type
    for (var b = 0; b < numButtons; b++) {
      allButtons[b].type = 'radio'
    }
  }

  // minimal appearance
  if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) {
    selectDropDownContainer.onchange = change // when the select dropdown is changed, call the change() function (which will update the current value)
  } else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
    for (var i = 0; i < numLikert; i++) {
      likertButtons[i].onclick = function () {
        if (!complete) {
          // clear previously selected option (if any)
          var selectedOption = document.querySelector('.likert-input-button.selected')
          if (selectedOption) {
            selectedOption.classList.remove('selected')
          }
          this.classList.add('selected') // mark clicked option as selected
          change.apply({ value: this.getAttribute('data-value') }) // call the change() function and tell it which value was selected

          if (nochange) {
            complete = true // This is so it knows to dissalow input when an answer is set
          }
        }
      }
    }
  } else { // all other appearances
    if (fieldType === 'select_one') { // Change to radio buttons if select_one
      for (var i = 0; i < numButtons; i++) {
        allButtons[i].type = 'radio'
      }
    }
    for (var i = 0; i < numButtons; i++) {
      allButtons[i].onchange = function () {
        // remove 'selected' class from a previously selected option (if any)
        var selectedOption = document.querySelector('.choice-container.selected')
        if ((selectedOption) && (fieldType === 'select_one')) {
          selectedOption.classList.remove('selected')
        }
        this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
        change.apply(this) // call the change() function and tell it which value was selected
      }
    }
  }

  establishTimeLeft()
  setInterval(timer, 1)
} // End "pass" value found

// FUNCTIONS

function clearAnswer () {
  // minimal appearance
  if (appearance.indexOf('minimal') !== -1) {
    selectDropDownContainer.value = ''
  } else if (appearance.indexOf('likert') !== -1) { // likert appearance
    var selectedOption = document.querySelector('.likert-input-button.selected')
    if (selectedOption) {
      selectedOption.classList.remove('selected')
    }
  } else { // all other appearances
    for (var b = 0; b < numButtons; b++) {
      var selectedOption = buttons[b]
      selectedOption.checked = false
      selectedOption.parentElement.classList.remove('selected')
    }
  }
  setAnswer('')
}

function checkComplete () { // Returns true if any of the choices has a CHOICE_SELECTED value of true. Otherwise, returns false.
  for (var c = 0; c < numChoices; c++) { // Checks each choice to see if the form has already been completed
    var choice = choices[c]
    if (choice.CHOICE_SELECTED) { // If a choice has a value, then that means the field is already complete
      return true // No need to check anymore if even one choice has been selected
    } // End going through each choice
  }
  return false
}

// Removed the containers that are not to be used
function removeContainer (keep) {
  if (keep !== 'radio') {
    radioButtonsContainer.parentElement.removeChild(radioButtonsContainer) // remove the default radio buttons
  }

  if (keep !== 'minimal') {
    selectDropDownContainer.parentElement.removeChild(selectDropDownContainer) // remove the select dropdown contrainer
  }

  if (keep !== 'likert') {
    likertContainer.parentElement.removeChild(likertContainer) // remove the likert container
  }

  if (keep !== 'label') {
    choiceLabelContainer.parentElement.removeChild(choiceLabelContainer)
  }

  if (keep !== 'nolabel') {
    listNoLabelContainer.parentElement.removeChild(listNoLabelContainer)
  }
}

// Save the user's response (update the current answer)
function change () {
  if (fieldType === 'select_one') {
    currentAnswer = this.value
    setAnswer(currentAnswer)
    // If the appearance is 'quick', then also progress to the next field
    if (appearance.indexOf('quick') !== -1) {
      goToNextField()
    }
  } else {
    var selected = []
    for (var c = 0; c < numChoices; c++) {
      if (choiceContainers[c].querySelector('INPUT').checked === true) {
        selected.push(choices[c].CHOICE_VALUE)
      }
    }
    currentAnswer = selected.join(' ')
    setAnswer(currentAnswer)
  }

  if (nochange) { // If not supposed to change the field after a value has been set, then this blocks the input once the value has been set.
    blockInput()
    complete = true
  }
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Detect right-to-left languages
function isRTL (s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF'
  var rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
  var rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']')

  return rtlDirCheck.test(s)
}

// TIME FUNCTIONS

function timer () {
  var timeNow = Date.now()
  if (!complete) {
    timePassed = timeNow - startTime
    timeLeft = timeStart - timePassed
  }

  if (timeLeft < 0) { // Timer ended
    blockInput()
    complete = true
    timeLeft = 0
    // timerDisp.innerHTML = String(Math.ceil(timeLeft / round))

    if ((currentAnswer == null) || (currentAnswer === '') || (Array.isArray(currentAnswer) && (currentAnswer.length === 0))) {
      setAnswer(missed)
    }
    setMetaData('0' + ' ' + String(timeNow))
    if (autoAdvance) {
      goToNextField()
    }
  }
  setMetaData(String(timeLeft) + ' ' + String(timeNow))

  if (dispTimer) {
    timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
  }
}

function establishTimeLeft () { // This checks the current answer and leftover time, and either auto-advances if there is no time left, or establishes how much time is left.
  if ((leftoverTime == null) || (leftoverTime === '') || isNaN(leftoverTime)) {
    startTime = Date.now()
    timeLeft = timeStart
  } else {
    timeLeft = leftoverTime
    startTime = Date.now() - (timeStart - timeLeft)
  }
} // End establishTimeLeft

// Makes radio/check buttons unusable if that setting is turned on
function blockInput () {
  if (block) {
    if (appearance.indexOf('minimal') !== -1) {
      selectDropDownContainer.disabled = true // Disable 'minimal' container
    } else if (appearance.indexOf('likert') !== -1) {
      for (var l = 0; l < numLikert; l++) {
        likertButtons[l].classList.add('disabled')
      }
    } else {
      for (var b = 0; b < numButtons; b++) {
        allButtons[b].disabled = true
      } // End FOR
    } // End ELSE
  } // End "block" is true
} // End blockInput

// This is so that if the time runs out when there is an invalid selection, then set to the "missed" value
function handleConstraintMessage (message) {
  setAnswer(missed)
}
