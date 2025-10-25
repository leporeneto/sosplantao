const firebaseConfig = {
  apiKey: "AIzaSyAfGykxsSTGYo6SKGhhUT1r4MMPhHIl9a0",
  authDomain: "receitas-medicas-64a41.firebaseapp.com",
  projectId: "receitas-medicas-64a41"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  auth.signInWithEmailAndPassword(email, senha)
    .then(() => window.location.href = "inicio.html")
    .catch(e => document.getElementById("mensagem").innerText = "Erro: " + e.message);
}

function criarConta() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  auth.createUserWithEmailAndPassword(email, senha)
    .then(() => window.location.href = "inicio.html")
    .catch(e => document.getElementById("mensagem").innerText = "Erro: " + e.message);
}

function esqueceuSenha() {
  const email = document.getElementById("email").value.trim();
  if (!email) return alert("Digite seu e-mail para redefinir a senha.");
  
  auth.sendPasswordResetEmail(email)
    .then(() => alert("E-mail de redefinição enviado!"))
    .catch(e => document.getElementById("mensagem").innerText = "Erro: " + e.message);
}
