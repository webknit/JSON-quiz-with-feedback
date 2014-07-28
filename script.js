var Webknit = Webknit || {};

Webknit.Quiz = function() {

	var question = $('.question');
	var quizQuestions = $('.quiz-questions');
	var quizQuestionsLi = $('.quiz-questions li');

	var response = $('#response');
	var startQuiz = $('#start-quiz');
	var nextQuestion = $('#next-question');

	var questionNumber = 0;
	var questionString;
	var userScore = 0;

	function init() {
		
		loadQuestions();
		startQuiz.click(getQuestion);
		quizQuestionsLi.click(answerQuestion);
		nextQuestion.click(getQuestion);

	}

	function answerQuestion(answer) {

		alert(userScore);

		response.show().empty().html(questionString[questionNumber].answers[answer].response);

		nextQuestion.show();

	}

	function getQuestion() {

		startQuiz.hide();
		nextQuestion.hide();
		response.hide();

		question.empty().html(questionString[questionNumber].text);

		quizQuestions.empty()

		quizQuestions.addClass('quiz-questions-answer');

		var i;
		for(i = 0; i < 5; i++)
		{
			
			quizQuestions.append('<li data-score="'+ questionString[questionNumber].answers[i].score + '" data-number="' + i + '">' + questionString[questionNumber].answers[i].text + '</li>');
							
		}

		questionNumber = questionNumber + 1;

		$(document).unbind('click').on('click', '.quiz-questions-answer li', function(){

			quizQuestions.removeClass('quiz-questions-answer');
		
			var answer = $(this).data('number');
			var scoreAmount = $(this).data('score');
			var score = parseInt(scoreAmount)
			userScore = userScore + score;

			answerQuestion(answer);

		});

	}

	function bindIt()
	{
		$('.self-evaluation-questions li').on('click tap', chooseAnswer);
	}
	
	function unbindIt()
	{
		$('.self-evaluation-questions li').off();
	}

	function loadQuestions() {

		$.getJSON("questions.json", function(json) {
		    
			questionString = json;

			console.log(json);

		});

	}

	init();

}

Webknit.Quizer = function()
{
	// Buttons
	var _button = {
		reset: $('.change-answer'),
		masterReset: $('.reset'),
		next: $('button.next-btn'),
		all: $('.self-evaluation .next-cancel')
	};

	// Styles
	var _style = {
		answered: 'answered',
		notAnswered: 'not-answered',
		chosen: 'chosen',
		show: 'show',
		hide: 'hide',
		hideFast: 'hide-fast'
	};

	// Containers
	var _container = {
		answers: $('.self-evaluation-questions'),
		question: $('p.question'),
		response: $('p.response')
	};
	
	// Data
	var _data = {
		route: 'route',
		question: 'question',
		answer: 'answer'
	};
	
	var _animationTimeout = 200;

	function init()
	{
		bindChoiceEvents();
		_button.reset.on('click tap', resetAnswers);
		_button.masterReset.on('click tap', masterReset);
		_button.next.on('click tap', setupNextQuestion);

		_button.masterReset.css('opacity', '0');
	}

	function chooseAnswer(e) 
	{
		e.stopImmediatePropagation();

		_button.masterReset.css('opacity', '1');
	
		var chosenAnswer = $(this);

		unbindChoiceEvents();
	
		// activate the answer
		$('.self-evaluation-questions li').addClass(_style.notAnswered);
		$(chosenAnswer).removeClass(_style.notAnswered).addClass(_style.answered);
		
		// Start chosen state
		$('.self-evaluation-questions').addClass(_style.chosen);
		
		var route = $(chosenAnswer).data(_data.route);
		var question = $(chosenAnswer).data(_data.question);
		var answer = $(chosenAnswer).data(_data.answer);
		
		// Are we already on a route?
		if (route)
			_container.answers.data(_data.route, route); // We are about to start a route
		else
			route = _container.answers.data(_data.route); // We are already on a route
		
		// Do we have a question?
		if (!question)
			question = 0;		
		
		// Do we have an answer?
		if (answer || answer === 0)	
			getAnswer(route, question, answer); // Lets get the answer!
		else
			getQuestion(route, question); // We don't have any answer - so we are about to begin a route
	};

	function resetAnswers(animationTimeout) 
	{
		// Unbind events
		unbindChoiceEvents();
		
		bindChoiceEvents();

		// reset chosen state
		if (animationTimeout)
		{
			setTimeout(function() {
				$('.self-evaluation-questions li').removeClass(_style.answered + ' ' + _style.notAnswered);
				_container.answers.removeClass(_style.chosen);	
			}, animationTimeout);
		}
		else
		{
			$('.self-evaluation-questions li').removeClass(_style.answered + ' ' + _style.notAnswered);
			_container.answers.removeClass(_style.chosen);	
		}
		
		_container.response.addClass(_style.hide);

		_button.all.removeClass(_style.show);
	};

	function masterReset() 
	{
		_button.all.removeClass(_style.show);
		_button.all.removeClass(_style.hide);
	
		getRoutes(function(routes) {
			processRoutes(routes);
		});
	};
	
	function bindChoiceEvents()
	{
		$('.self-evaluation-questions li').on('click tap', chooseAnswer);
	}
	
	function unbindChoiceEvents()
	{
		$('.self-evaluation-questions li').off();
	}
	
	function setupNextQuestion()
	{
		_container.response.addClass(_style.hideFast);
		_button.all.addClass(_style.hideFast);
	
		var route = _container.answers.data(_data.route);
		var question = $(this).data(_data.question);
		
		getQuestion(route, question);
	}
	
	function getQuestion(route, questionNo)
	{
		getRouteData(route, function(questions) {			
			processQuestion(questions, questionNo);
		});
	};
	
	function processQuestion(questions, questionNo)
	{
		if (questions.length > questionNo)
		{	
			// Get question
			var question = questions[questionNo];
			
			renderQuestionText(question["text"]);
			renderAnswers(question["answers"], questionNo);
		
			// Assign next question no to next button
			_button.next.data(_data.question, questionNo+1);
		
			// Re-assign click event
			bindChoiceEvents();
		
			// Reset styles
			resetAnswers(_animationTimeout);
		}
	};
	
	function renderQuestionText(text)
	{
		_container.question.removeClass(_style.show);

		_container.question.html(text);
		
		_container.question.addClass(_style.show);
		
	}
	
	function renderAnswers(answers, questionNo)
	{
		// Unload answers
		_container.answers.empty();
		
		if (answers)
		{		
			$.each(answers, function( answerNo, answer ) {
				_container.answers.append('<li data-question="' + questionNo + '" data-answer="' + answerNo + '" class="'+_style.notAnswered+'"><span>' + answer["text"] + '</span></li>');
			});
		}
		else
		{	
			// No answers - We've reached the end of the quiz!
			endQuiz();
		}
	}
	
	function getAnswer(route, questionNo, answerNo)
	{
		getRouteData(route, function(questions) {			
			processAnswer(questions, questionNo, answerNo);
		});
	};
	
	function processAnswer(questions, questionNo, answerNo)
	{
		// Get question
		var question = questions[questionNo];
		
		// Get answers
		var answers = question["answers"];	
	
		if (answers.length > answerNo)
		{
			_button.all.removeClass(_style.hideFast);
			_container.response.removeClass(_style.hideFast);
		
			// Get answer
			var answer = answers[answerNo];
			
			// Set the response
			_container.response.html(answer["response"]);
			_container.response.removeClass(_style.hide);

			_button.all.addClass(_style.show);
		}

		$('.self-evaluation-questions li.answered').on('click tap', resetAnswers);	
	};
	
	function getRoutes(callback)
	{
		var routes = getRoutesFromStorage();
		
		if (routes)
		{
			callback(routes);
			return;
		}
		
		getRoutesFromServer(callback);
	};
	
	function getRouteData(route, callback)
	{
		var questions = getRouteDataFromStorage(route);
		
		if (questions)
		{
			callback(questions);
			return;
		}
		
		getRouteDataFromServer(route, callback);
	}
	
	function getRouteDataFromServer(route, callback)
	{
		$.getJSON("assets/js/route"+route+".json", function(data) {
			var questions = data["route"];
			
			setRouteDataInStorage(route, questions);
			
			callback(questions);
		});
	}
	
	function getRouteDataFromStorage(route)
	{
		var questions;
	
		if (window.sessionStorage)
		{
			var returnedQuestions = window.sessionStorage.getItem(route);
			
			if (returnedQuestions)
				questions = JSON.parse(returnedQuestions);
		}
		
		return questions;
	}
	
	function setRouteDataInStorage(route, questions)
	{
		if (window.sessionStorage)
			window.sessionStorage.setItem(route,JSON.stringify(questions));
	}
	
	function getRoutesFromServer(callback)
	{
		$.getJSON("assets/js/routes.json", function(data) {
			setRoutesInStorage(data);			
			callback(data);
		});
	}
	
	function getRoutesFromStorage()
	{
		var routes;
	
		if (window.sessionStorage)
		{
			var returnedRoutes = window.sessionStorage.getItem('routes');
			
			if (returnedRoutes)
				routes = JSON.parse(returnedRoutes);
		}
		
		return routes;
	}
	
	function setRoutesInStorage(routes)
	{
		if (window.sessionStorage)
			window.sessionStorage.setItem('routes',JSON.stringify(routes));
	}
	
	function processRoutes(routes)
	{	
		if (routes)
		{
			_container.question.removeClass(_style.show);
			
			_container.question.empty();

			_container.answers.removeData();			

			_container.answers.empty();
			
			_container.answers.addClass(_style.chosen);
			
			$.each(routes["routes"], function( index, value ) {
				_container.answers.append('<li data-route="' + (index+1) + '" class="'+_style.notAnswered+'"><span>' + value + '</span></li>');
			});
			
			resetAnswers(_container.answers.hasClass(_style.chosen) ? (_animationTimeout*2) : _animationTimeout);
		}
	};
	
	function endQuiz()
	{
		_button.all.addClass(_style.hide);
		_container.response.addClass(_style.hide);		
	};

	init();
};

// ON DOC READY
$(function() {

	new Webknit.Quiz();
	
});

