firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  const uid = user.uid;
  const db = firebase.firestore();

  const localSelect = document.getElementById("select-local");
  const periodoSelect = document.getElementById("select-periodo");
  const btnAddLocal = document.getElementById("add-local");
  const btnAddPeriodo = document.getElementById("add-periodo");

  carregarOpcoes("locais_plantao", localSelect);
  carregarOpcoes("periodos_plantao", periodoSelect);

  btnAddLocal.addEventListener("click", () => adicionarOpcao("locais_plantao", "Local", localSelect));
  btnAddPeriodo.addEventListener("click", () => adicionarOpcao("periodos_plantao", "Período", periodoSelect));

  function carregarOpcoes(colecao, selectElement) {
    db.collection(colecao)
      .where("uid", "==", uid)
      .orderBy("nome")
      .get()
      .then(snapshot => {
        selectElement.innerHTML = "";
        snapshot.forEach(doc => {
          const option = document.createElement("option");
          option.value = doc.data().nome;
          option.textContent = doc.data().nome;
          selectElement.appendChild(option);
        });
      })
      .catch(error => {
        console.error("Erro ao carregar opções:", error);
        alert("Erro ao carregar dados de " + colecao);
      });
  }

  function adicionarOpcao(colecao, label, selectElement) {
    const nome = prompt(`Digite o novo ${label}:`);
    if (!nome) return;

    db.collection(colecao).add({ uid, nome })
      .then(() => {
        alert(`${label} adicionado com sucesso.`);
        carregarOpcoes(colecao, selectElement);
      })
      .catch(error => {
        console.error("Erro ao adicionar:", error);
        alert("Erro ao adicionar novo " + label);
      });
  }
});
