var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId){
  models.Quiz.find(quizId).then(
    function(quiz) {
      if(quiz){
        req.quiz = quiz;
        next();
      } else { next(new Error('No existe quizId:' + quizId));}
    }
  ).catch(function(error){ next(error);});
};

// GET /quizes
exports.index = function(req, res){
  var quizElements;

  if(req.query.search)
  {
    // - Considero sólo las palabras, considerando también números (primero sustituyo las
    //   "no palabras" en espacios y posteriormente los grupos de espacios en '%')
    // Paso el texto a minúsculas y comparo en BD en minúsculas para hacer más efectiva la búsqueda.
    var texto = ' ' + req.query.search + ' '; // añado ' ' que serán sustituidos por '%'
    var texto = texto.replace(/[^(\w+)]/g, ' ').replace(/(\s+)/g, '%').toLowerCase();
  } else texto = '%';

  // Considero que sólo buscaremos cuando se indique al menos una palabra válida en
  // el filtro de búsqueda
  if(texto !== '%')
  {
    quizElements = models.Quiz.findAll({where: ["lower(pregunta) like ?", texto],
                                        order: 'pregunta'});
  } else {
    quizElements = models.Quiz.findAll();
  }

  quizElements.then(function(quizes){
    res.render('quizes/index.ejs', {quizes: quizes, errors: []});
  }).catch(function(error){next(error)});
};

// GET /quizes/:id
exports.show = function(req, res){
  models.Quiz.find(req.params.quizId).then(function (quiz){
    res.render('quizes/show', {quiz: req.quiz, errors: []});
  });
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
  var resultado = 'Incorrecto';
  if(req.query.respuesta === req.quiz.respuesta){
    resultado = 'Correcto';
  }
  res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
};

//GET /quizes/new
exports.new = function(req, res){
  var quiz = models.Quiz.build(
      {pregunta: "Pregunta", respuesta: "Respuesta", tema: "otro"}
  );

  res.render('quizes/new', {quiz: quiz, errors: []});
};

//POST /quizes/create
exports.create = function(req, res){
  var quiz = models.Quiz.build(req.body.quiz);

  quiz
  .validate()
  .then(
    function(err){
      if(err){
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else { // guarda en db los campos pregunta y respuesta del quiz
        quiz
        .save({fileds: ["pregunta", "respuesta", "tema"]})
        .then(function(){res.redirect('/quizes')}) // redirección HTTP (URL relativo) lista de preguntas
      }
    }
  );
};

// GET /quizes/:id/edit
exports.edit = function(req, res){
  var quiz = req.quiz; // autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors:[]});
};

// PUT /quizes/:id
exports.update = function(req, res){
  req.quiz.pregunta = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if(err){
        res.render('quizes/edit', {quiz: req.quiz, errors:err.errors});
      } else {
          req.quiz
          .save({fields: ['pregunta', 'respuesta', 'tema']})
          .then(function(){res.redirect('/quizes');});
      }
    }
  );
};

//DELETE /quizes/:id
exports.destroy = function(req, res){
  req.quiz.destroy().then(
    function(){
      res.redirect('/quizes');
    }
  ).catch(function(error){next(error)});
};
