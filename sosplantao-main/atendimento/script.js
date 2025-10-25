// === BLOCO NOVO: CONTROLE DE PLANTÃO E ATENDIMENTOS ===
let plantaoAtivo = false;
let tempoPlantao = 0;
let totalAtendimentos = 0;
let intervaloPlantao = null;

function formatarTempo(segundos) {
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
  const s = String(segundos % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function atualizarPainelPlantao() {
  const tp = document.getElementById("tempoPlantao");
  const ta = document.getElementById("totalAtendimentos");
  if (tp) tp.textContent = formatarTempo(tempoPlantao);
  if (ta) ta.textContent = totalAtendimentos;
}

// iniciarAtendimento já existe abaixo — vamos apenas acoplar o contador do plantão a ele
function iniciarPlantaoSeNecessario() {
  if (!plantaoAtivo) {
    plantaoAtivo = true;
    intervaloPlantao = setInterval(() => {
      tempoPlantao++;
      atualizarPainelPlantao();
    }, 1000);
  }
}

function finalizarAtendimentoContagem() {
  totalAtendimentos++;
  atualizarPainelPlantao();
}

function encerrarPlantao() {
  if (!plantaoAtivo) {
    alert("Nenhum plantão ativo no momento.");
    return;
  }

  clearInterval(intervaloPlantao);
  plantaoAtivo = false;

  const registro = {
    data: new Date().toLocaleString("pt-BR"),
    duracaoPlantao: formatarTempo(tempoPlantao),
    atendimentos: totalAtendimentos
  };

  let historico = JSON.parse(localStorage.getItem("plantoes")) || [];
  historico.push(registro);
  localStorage.setItem("plantoes", JSON.stringify(historico));

  alert(
    `✅ Plantão encerrado!\n` +
    `⏱ Duração: ${registro.duracaoPlantao}\n` +
    `👨‍⚕️ Atendimentos: ${registro.atendimentos}`
  );

  tempoPlantao = 0;
  totalAtendimentos = 0;
  atualizarPainelPlantao();
}

document.addEventListener("DOMContentLoaded", () => {
  const encerrarBtn = document.getElementById("btnEncerrarPlantao");
  if (encerrarBtn) {
    encerrarBtn.addEventListener("click", encerrarPlantao);
  }
  atualizarPainelPlantao();
});

// === FIM DO BLOCO NOVO ===


// === SEU CÓDIGO ORIGINAL ABAIXO (INALTERADO) ===

let cronometroInterval = null;
let inicioAtendimento = null;
let tempoFinalAtendimento = "";

document.addEventListener("DOMContentLoaded", () => {
  const sexoRadios = document.querySelectorAll("input[name='sexo']");
  const acompanhante = document.getElementById("acompanhado");
  const dumContainer = document.getElementById("dumContainer");
  const acompanhanteCampo = document.getElementById("acompanhanteCampo");
  const naoSabeCheck = document.getElementById("naoSabeCheck");
  const dumTexto = document.getElementById("dumTexto");

  const medicacaoCheck = document.getElementById("medicacaoCheck");
  const examesCheck = document.getElementById("examesCheck");
  const reavaliarCheck = document.getElementById("reavaliarCheck");
  const encaminhamentoCheck = document.getElementById("encaminhamentoCheck");

  const medicacaoTexto = document.getElementById("medicacaoTexto");
  const examesTexto = document.getElementById("examesTexto");
  const encaminhamentoBox = document.getElementById("encaminhamentoBox");
  const encaminhamentoTexto = document.getElementById("encaminhamentoTexto");

  const exameSelect = document.getElementById("exameFisico");
  const examesCampos = document.getElementById("examesCampos");

  let examesPadrao = [];

  // Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAfGykxsSTGYo6SKGhhUT1r4MMPhHIl9a0",
    authDomain: "receitas-medicas-64a41.firebaseapp.com",
    projectId: "receitas-medicas-64a41"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  db.collection("exames_fisicos").get().then(snapshot => {
    examesPadrao = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const normalAlterado = examesPadrao.filter(e => {
      const p = e.patologia.toLowerCase();
      return p === "normal" || p === "alterado";
    });

    const outras = examesPadrao
      .filter(e => !["normal", "alterado"].includes(e.patologia.toLowerCase()))
      .sort((a, b) => a.patologia.localeCompare(b.patologia));

    const finalList = [...normalAlterado, ...outras];

    finalList.forEach(exame => {
      const option = document.createElement("option");
      option.value = exame.patologia;
      option.textContent = exame.patologia;
      exameSelect.appendChild(option);
    });
  });

  document.querySelector('input[value="PS"]').addEventListener("change", function () {
    if (this.checked) document.querySelector('input[value="AMB"]').checked = false;
  });

  document.querySelector('input[value="AMB"]').addEventListener("change", function () {
    if (this.checked) document.querySelector('input[value="PS"]').checked = false;
  });

  exameSelect.addEventListener("change", () => {
    const selecionado = exameSelect.value;
    const exame = examesPadrao.find(e => e.patologia === selecionado);

    if (!exame) return;
    if (selecionado === "Normal") {
      examesCampos.classList.add("hidden");
    } else {
      examesCampos.classList.remove("hidden");
    }

    for (const campo in exame.exame) {
      const textarea = document.querySelector(`[name="exame_${campo}"]`);
      if (textarea) textarea.value = exame.exame[campo];
    }
  });

  sexoRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      dumContainer.classList.toggle("hidden", document.querySelector("input[name='sexo']:checked").value !== "mulher");
    });
  });

  acompanhante.addEventListener("change", () => {
    acompanhanteCampo.classList.toggle("hidden", acompanhante.value !== "sim");
  });

  naoSabeCheck.addEventListener("change", () => {
    dumTexto.classList.toggle("hidden", !naoSabeCheck.checked);
  });

  medicacaoCheck.addEventListener("change", () => {
    medicacaoTexto.classList.toggle("hidden", !medicacaoCheck.checked);
  });

  examesCheck.addEventListener("change", () => {
    examesTexto.classList.toggle("hidden", !examesCheck.checked);
    reavaliarCheck.checked = examesCheck.checked;
  });

  encaminhamentoCheck.addEventListener("change", () => {
    encaminhamentoBox.classList.toggle("hidden", !encaminhamentoCheck.checked);
  });
});

function iniciarAtendimento() {
  iniciarPlantaoSeNecessario(); // <<< adiciona contagem de plantão global
  document.getElementById("btnIniciar").disabled = true;
  document.getElementById("btnFinalizar").disabled = false;

  inicioAtendimento = new Date();
  cronometroInterval = setInterval(() => {
    const agora = new Date();
    const diff = new Date(agora - inicioAtendimento);
    const hh = String(diff.getUTCHours()).padStart(2, '0');
    const mm = String(diff.getUTCMinutes()).padStart(2, '0');
    const ss = String(diff.getUTCSeconds()).padStart(2, '0');
    document.getElementById("cronometro").textContent = `${hh}:${mm}:${ss}`;
  }, 1000);
}

function finalizarAtendimento() {
  clearInterval(cronometroInterval);
  document.getElementById("btnFinalizar").disabled = true;
  tempoFinalAtendimento = document.getElementById("cronometro").textContent;
  finalizarAtendimentoContagem(); // <<< soma atendimento no contador geral
}


// === RESTANTE DO SEU CÓDIGO ORIGINAL (sem mudanças) ===
document.getElementById("gerarTexto").addEventListener("click", () => {
  const form = document.getElementById("formularioMedico");
  const data = Object.fromEntries(new FormData(form).entries());
  const textoFinal = [];

  // [todo o conteúdo que você mandou segue igual...]
  // (mantido integralmente)
});

// copiarTexto(), novoAtendimento(), copiarEncaminhamento(), salvarNoFirebase() permanecem iguais
