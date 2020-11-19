//jshint esversion:6

/* dotenv es un modulo de npm que nos permite configurar variables de entorno, para poder ser agregadas mediante un gitignore al repositorio de git  */
/* siempre va al top, lo instalamos con npm i dotenv, luego de instalado y requerido tenemos que crear un archivo .env en la raiz de nuestro proyecto */

/* creamos el gitignore para nuestro proyecto en base a esto 
https://github.com/github/gitignore/blob/master/Node.gitignore
*/

require("dotenv").config();

/* requerimos los modulos instalados 
    npm i ejs express body-parser mongoose
*/

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// const encrypt = require("mongoose-encryption"); lo comento por que vamos a usar md5 para hashear
/* moongose encryption es un paquete de npm que nos permite encriptar y autenticar passwords en nuestra app
se instala con npm i mongoose-encryption
https://www.npmjs.com/package/mongoose-encryption
*/

//lo comento porque ahora vamos a usar bcrypt para robustecer el storage de contrasenias
// const md5 = require("md5"); //https://www.npmjs.com/package/md5

/* comentamos la parte bcrypt porque ahora vamos a usar passport */
// const bcrypt = require("bcrypt");
// const saltRounds = 10; // la cantidad de veces que se va a aplicar el proceso al hash para modificarlo
/* es un paquete que nos ayuda a fortalecer las passwords con rondas de salt  
https://www.npmjs.com/package/bcrypt*/

/* instalmos los paquetes necesario para passport y session */
// npm i passport passport-local passport-local-mongoose express-session
const session = require("express-session");
//https://www.npmjs.com/package/express-session
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
/* luego de haber instalado el paquete para autenticacion de google npm install passport-google-oauth20 lo requerimos */
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//este app.use del session siempre debe ir aca, entre los otros app.use y la conexion a la bd
app.use(
  session({
    secret: "Una Frase Larga Cualquiera.",
    resave: false,
    saveUninitialized: false,
  })
);

//inicializacioms passport, esto es un metodo propio de passport
app.use(passport.initialize());
app.use(passport.session());

/* dataBase creation and connection */
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true); //para resolver el deprecationWarning de mongo-passport

/*---------------------------------------------------------*/

/*-------- creamos el schema --------*/
/* comento este schema que cree al comienzo para crear uno nuevo que incorpore la funcion de encriptacion */

// const userSchema = {
//   email: String,
//   password: String,
// };

//nuevo schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

// const secret = "NoEntiendoQueEraEsto"; /*1) esta const secret viene de la documentacion */
//2) me llevo esta constante al archivo .env por eso la comento

/* tomamos el schema que creamos en el paso anterior y le sumamos el plugin de encryt */
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// }); /* le podemos pasar como parametro solo el campo que queremos encriptar en este caso el password */
//comentamos esto de nuevo porque ahora no vamos a usar el encryptation sino el hasd de md5

//volvemos nuevamente a usar un plugin pero esta vez para passport
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

/*-------- creamos el model  --------*/

const User = new mongoose.model("User", userSchema);

//agregamos la estrategia de passport

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//agregamos la estrategia de google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accesToken, refreshtoken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

/*---------------------------------------------------------*/

app.get("/", function (req, res) {
  res.render("home");
});
/* targueteamos al home route(/) para que renderee el home page */

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});
/* targueteamos a la login page(/login) para que renderee la pagina login */

app.get("/register", function (req, res) {
  res.render("register");
});
/* targueteamos a la register page(/registter) para que renderee la pagina de registro */

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
// si es autenticado correctamente con passport redirige a secrets, ifnot redirige a login de nuevo

app.get("/logout", function (req, res) {
  req.logout(); //desauntetico al usuario
  res.redirect("/");
});
/*---------------------------------------------------------*/

/* guardamos el nuevo usuario en el register*/

/* Del form dentro de /register vamos a guardar el mail y el password*/
app.post("/register", function (req, res) {
  /* Comento toda esta seccion del login porque ahora voy a usar passport */
  // //esta funcion viene directo de la documentacin de bcrypt
  // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash,
  //   });
  //   /* salvamos los datos del usuario y le damos acceso a /secrets */
  //   newUser.save(function (err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });
  /********* inicio **********/
  //*Esta parte la estoy comentando porque la estoy mudadando dentro de la funcion bcrypt
  // const newUser = new User({
  //   email: req.body.username,
  //   password: md5(req.body.password), //usamos el hash function para convertir la pass en un hash
  // });
  // /* salvamos los datos del usuario y le damos acceso a /secrets */
  // newUser.save(function (err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.render("secrets");
  //   }
  // });
  /********* end **********/

  /********* registro con passport **********/
  User.register({ username: req.body.username }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});
/*---------------------------------------------------------*/
/* creamos el post del login */
app.post("/login", function (req, res) {
  /* buscamos dentro de la base de datos si los datos ingresados en el form los tenemos */
  /* Comento toda esta seccion del login porque ahora voy a usar passport */
  // const username = req.body.username;
  // const password = req.body.password;
  // // comento la const con md5 porque ahora usare bcrypt
  // // const password = md5(req.body.password); //con la funcion md5 comparamos el hash generado en el registro con el hash del login, porque los hash siempre seran iguales.
  // /* dentro de la bsase, con el metodo propio findOne buscamos el mail del usuario */
  // User.findOne({ email: username }, function (err, foundUser) {
  //   if (err) {
  //     /* si tuvimos un error lo logueamos */
  //     console.log(err);
  //   } else {
  //     if (foundUser) {
  //       /* sino, revisamos que la pass se corresponda con la almacenada, si corresponde damos acceso a secrets */
  //       // if (foundUser.password === password) { //comento esta linea porque abajo voy a hacer uso de la funcion brypt
  //       bcrypt.compare(password, foundUser.password, function (err, result) {
  //         if (result === true) {
  //           res.render("secrets");
  //         }
  //         // result == true
  //       });
  //       // res.render("secrets");
  //     }
  //   }
  // });

  /********* login con passport **********/
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

/* para la encryptacion-desencriptacion no tenemos que hacer nada mas
mongoose y moongose-encryption se encarga de encriptar al dar save y desencripta cuando hacemos el findOne */

/*-------- Server connection --------*/
app.listen(3000, function () {
  console.log("server started on port 3000");
});
