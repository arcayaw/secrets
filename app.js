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
const md5 = require("md5"); //https://www.npmjs.com/package/md5

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

/* dataBase creation and connection */
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
});

// const secret = "NoEntiendoQueEraEsto"; /*1) esta const secret viene de la documentacion */
//2) me llevo esta constante al archivo .env por eso la comento

/* tomamos el schema que creamos en el paso anterior y le sumamos el plugin de encryt */
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// }); /* le podemos pasar como parametro solo el campo que queremos encriptar en este caso el password */
//comentamos esto de nuevo porque ahora no vamos a usar el encryptation sino el hasd de md5

/*-------- creamos el model  --------*/

const User = new mongoose.model("User", userSchema);

/*---------------------------------------------------------*/

app.get("/", function (req, res) {
  res.render("home");
});
/* targueteamos al home route(/) para que renderee el home page */

app.get("/login", function (req, res) {
  res.render("login");
});
/* targueteamos a la login page(/login) para que renderee la pagina login */

app.get("/register", function (req, res) {
  res.render("register");
});
/* targueteamos a la register page(/registter) para que renderee la pagina de registro */
/*---------------------------------------------------------*/

/* guardamos el nuevo usuario en el register*/

/* Del form dentro de /register vamos a guardar el mail y el password*/
app.post("/register", function (req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password), //usamos el hash function para convertir la pass en un hash
  });

  /* salvamos los datos del usuario y le damos acceso a /secrets */
  newUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});
/*---------------------------------------------------------*/
/* creamos el post del login */
app.post("/login", function (req, res) {
  /* buscamos dentro de la base de datos si los datos ingresados en el form los tenemos */

  const username = req.body.username;
  const password = md5(req.body.password); //con la funcion md5 comparamos el hash generado en el registro con el hash del login, porque los hash siempre seran iguales.

  /* dentro de la bsase, con el metodo propio findOne buscamos el mail del usuario */
  User.findOne({ email: username }, function (err, foundUser) {
    if (err) {
      /* si tuvimos un error lo logueamos */
      console.log(err);
    } else {
      if (foundUser) {
        /* sino, revisamos que la pass se corresponda con la almacenada, si corresponde damos acceso a secrets */
        if (foundUser.password === password) {
          res.render("secrets");
        }
      }
    }
  });
});

/* para la encryptacion-desencriptacion no tenemos que hacer nada mas
mongoose y moongose-encryption se encarga de encriptar al dar save y desencripta cuando hacemos el findOne */

/*-------- Server connection --------*/
app.listen(3000, function () {
  console.log("server started on port 3000");
});
