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
  function iniciarAtendimento() {
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
}
  document.getElementById("gerarTexto").addEventListener("click", () => {
    const form = document.getElementById("formularioMedico");
    const data = Object.fromEntries(new FormData(form).entries());
    const textoFinal = [];

    // Q/HPMA
    if (data.acompanhado === "sim" && data.acompanhanteInfo) {
    textoFinal.push(`# Q/HPMA:\nPaciente acompanhado por: ${data.acompanhanteInfo}. Refere ${data.queixas}. Nega outras queixas ou sintomas associados.`);
    } else {
    textoFinal.push(`# Q/HPMA:\nPaciente refere ${data.queixas}. Nega outras queixas ou sintomas associados.`);
    }

    // ANTECEDENTES
    textoFinal.push(`# ANTECEDENTES PESSOAIS:`);
    textoFinal.push(`- Comorbidades: ${data.comorbidades}`);
    textoFinal.push(`- Medicamentos de uso contínuo: ${data.medicamentos}`);
    textoFinal.push(`- Alergias: ${data.alergias}`);

    const sexo = document.querySelector("input[name='sexo']:checked").value;
    if (sexo === "mulher") {
      let complemento = "";
      if (document.querySelector('input[value="gestante"]').checked) {
        complemento = "- Gestante";
      } else if (document.querySelector('input[value="lactante"]').checked) {
        complemento = "- Em amamentação";
      } else if (document.querySelector('input[value="menopausa"]').checked) {
        complemento = "- Nega gestação e amamentação: Menopausa";
      } else if (document.querySelector('input[value="histerectomia"]').checked) {
        complemento = "- Nega gestação e amamentação: Histerectomia";
      } else if (document.querySelector('input[value="diu"]').checked) {
        complemento = "- Nega gestação e amamentação: Uso de DIU/AC contínuo";
      } else if (document.querySelector('input[value="naoSabe"]').checked) {
        complemento = `- Nega gestação e amamentação: DUM (não sabe referir com exatidão - ${dumTexto.value})`;
      } else if (data.dum) {
        complemento = `- Nega gestação e amamentação: DUM (${data.dum})`;
      }
      if (complemento) textoFinal.push(complemento);
    }

    // EXAME FISICO
    const exameSelecionado = exameSelect.value;
    const exame = examesPadrao.find(e => e.patologia === exameSelecionado);
    if (exame) {
      textoFinal.push(`# EXAME FÍSICO:`);
      const ordemPadrao = ["geral", "neuro", "ar", "acv", "abd", "mmii"];
      const todosCampos = Object.keys(exame.exame);
      
      // Primeiro os padrões
      ordemPadrao.forEach(campo => {
        if (exame.exame[campo]) {
          let txt = exame.exame[campo];
          if (sexo === "mulher") {
            txt = txt.replace(/corado/g, "corada")
                     .replace(/hidratado/g, "hidratada")
                     .replace(/acianótico/g, "acianótica")
                     .replace(/eupneico/g, "eupneica");
          }
          textoFinal.push(`- ${campo.toUpperCase()}: ${txt}`);
        }
      });
      
      // Depois os extras (qualquer um que não esteja na ordem fixa)
      todosCampos.forEach(campo => {
        if (!ordemPadrao.includes(campo) && exame.exame[campo]) {
          let txt = exame.exame[campo];
          if (sexo === "mulher") {
            txt = txt.replace(/corado/g, "corada")
                     .replace(/hidratado/g, "hidratada")
                     .replace(/acianótico/g, "acianótica")
                     .replace(/eupneico/g, "eupneica");
          }
          textoFinal.push(`- ${campo.toUpperCase()}: ${txt}`);
        }
      });

    }

    // HIPOTESE
    textoFinal.push(`# HD:\n${data.diagnostico}`);

    // CONDUTA
    textoFinal.push(`# CONDUTA:`);

    if (medicacaoCheck.checked && medicacaoTexto.value) {
      textoFinal.push(`- Prescrevo medicação para uso hospitalar: ${medicacaoTexto.value}`);
    }

    if (examesCheck.checked && examesTexto.value) {
      textoFinal.push(`- Solicito exames: ${examesTexto.value}`);
    }

    if (reavaliarCheck.checked) {
      if (examesCheck.checked && medicacaoCheck.checked) {
        textoFinal.push(`- Reavaliar paciente após exames e medicação hospitalar`);
      } else if (examesCheck.checked) {
        textoFinal.push(`- Reavaliar paciente após exames`);
      } else if (medicacaoCheck.checked) {
        textoFinal.push(`- Reavaliar paciente após medicação hospitalar`);
      }
    }

    if (document.getElementById("receitaCheck").checked) {
      textoFinal.push("- Prescrevo medicação para uso domiciliar conforme receita entregue para o paciente e registrada no sistema de prontuário eletrônico;");
    }

    if (document.getElementById("cuidadosCheck").checked) {
      textoFinal.push("- Oriento cuidados em domicilio;");
      textoFinal.push("- Oriento sinais de alarme para procurar serviço de saúde precocemente se necessário;");
      textoFinal.push("- Paciente ciente e concordante com as condutas;");
    }

    if (encaminhamentoCheck.checked) {
      const isPS = document.querySelector('input[value="PS"]').checked;
      const isAMB = document.querySelector('input[value="AMB"]').checked;
      const esp = encaminhamentoTexto.value || "a especialidade necessária";
      if (isPS) {
        textoFinal.push(`- Encaminho para atendimento no PS com a especialidade de ${esp};`);
      } else if (isAMB) {
        textoFinal.push(`- Encaminho para atendimento ambulatorial com a especialidade de ${esp};`);
        document.getElementById("btnEncaminhamento").classList.remove("hidden");
      } else {
        document.getElementById("btnEncaminhamento").classList.add("hidden");
      }
    } else {
      document.getElementById("btnEncaminhamento").classList.add("hidden");
    }

    if (document.getElementById("atestadoCheck").checked) {
      textoFinal.push("- Forneço atestado médico, com CID (solicitado e autorizado pelo paciente), entregue para o paciente e registrado no sistema de prontuário eletrônico;");
    }

    if (document.getElementById("altaCheck").checked) {
      if (medicacaoCheck.checked) {
        textoFinal.push("- Alta após medicação hospitalar");
      } else {
        textoFinal.push("- Alta hospitalar");
      }
    }

    // Junta os blocos corretamente:
    // - quebra dupla entre blocos
    // - sem quebras dentro de blocos
    const final = textoFinal
      .map(bloco => bloco.trim())
      .join("\n")                           // junta tudo com quebra simples
      .replace(/(# [^\n]+:\n)/g, "\n$1")   // adiciona quebra antes de cada bloco
      .trim();

    document.getElementById("textoGerado").value = final;
    document.getElementById("blocoResultado").classList.remove("hidden");

    salvarNoFirebase(data, final);
  });
});

function copiarTexto() {
  const txt = document.getElementById("textoGerado").value;
  navigator.clipboard.writeText(txt).then(() => alert("Texto copiado!"));
}

function novoAtendimento() {
  location.reload();
}

function copiarEncaminhamento() {
  const esp = document.getElementById("encaminhamentoTexto").value || "a especialidade solicitada";
  const encaminhamento = `Encaminho paciente para avaliação e seguimento ambulatorial com ${esp}.\n\nGrato.`;
  navigator.clipboard.writeText(encaminhamento).then(() => alert("Texto de encaminhamento copiado!"));
}

function salvarNoFirebase(data, textoFinal) {
  const now = new Date();
  const payload = {
    data: now.toISOString().split("T")[0],
    hora: now.toTimeString().slice(0,5),
    nome: data.nome,
    sexo: document.querySelector("input[name='sexo']:checked").value,
    acompanhado: data.acompanhado,
    queixas: data.queixas,
    textoFinal: textoFinal,
    medicacaoHospitalar: medicacaoCheck.checked ? medicacaoTexto.value : "",
    exames: examesCheck.checked ? examesTexto.value : "",
    encaminhamento: encaminhamentoCheck.checked ? encaminhamentoTexto.value : ""
  };

  firebase.firestore().collection("atendimentos").add(payload)
    .then(() => console.log("Atendimento salvo no Firebase"))
    .catch(e => console.error("Erro ao salvar atendimento:", e));
}
