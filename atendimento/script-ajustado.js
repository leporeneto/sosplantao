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

    const ordenadas = examesPadrao
      .filter(e => e.patologia.toLowerCase() !== "normal" && e.patologia.toLowerCase() !== "alterado")
      .sort((a, b) => a.patologia.localeCompare(b.patologia));

    const todas = ["Normal", "Alterado", ...ordenadas.map(e => e.patologia)];
    todas.forEach(patologia => {
      const option = document.createElement("option");
      option.value = patologia;
      option.textContent = patologia;
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
    examesCampos.classList.toggle("hidden", selecionado === "Normal");

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

  document.getElementById("gerarTexto").addEventListener("click", () => {
    const form = document.getElementById("formularioMedico");
    const data = Object.fromEntries(new FormData(form).entries());
    const textoFinal = [];

    // Q/HPMA
    const hpma = data.acompanhado === "sim" && data.acompanhanteInfo
      ? `Paciente acompanhado por: ${data.acompanhanteInfo}. Refere ${data.queixas}. Nega outras queixas ou sintomas associados.`
      : `Paciente refere ${data.queixas}. Nega outras queixas ou sintomas associados.`;
    textoFinal.push(`# Q/HPMA:
${hpma}`);

    // ANTECEDENTES
    textoFinal.push(`# ANTECEDENTES PESSOAIS:
- Comorbidades: ${data.comorbidades}
- Medicamentos de uso contínuo: ${data.medicamentos}
- Alergias: ${data.alergias}`);

    const sexo = document.querySelector("input[name='sexo']:checked").value;
    if (sexo === "mulher") {
      const checks = ["gestante", "lactante", "menopausa", "histerectomia", "diu", "naoSabe"];
      for (let chk of checks) {
        if (document.querySelector(`input[value="${chk}"]`)?.checked) {
          const txt = chk === "naoSabe"
            ? `- Nega gestação e amamentação: DUM (não sabe referir com exatidão - ${dumTexto.value})`
            : chk === "gestante" ? "- Gestante"
            : chk === "lactante" ? "- Em amamentação"
            : chk === "menopausa" ? "- Nega gestação e amamentação: Menopausa"
            : chk === "histerectomia" ? "- Nega gestação e amamentação: Histerectomia"
            : "- Nega gestação e amamentação: Uso de DIU/AC contínuo";
          textoFinal.push(txt);
          break;
        }
      }
      if (!checks.some(c => document.querySelector(`input[value="${c}"]`)?.checked) && data.dum)
        textoFinal.push(`- Nega gestação e amamentação: DUM (${data.dum})`);
    }

    // EXAME FÍSICO
    const exameSelecionado = exameSelect.value;
    const exame = examesPadrao.find(e => e.patologia === exameSelecionado);
    if (exame) {
      let exameTexto = "# EXAME FÍSICO:";
      const ordemPadrao = ["geral", "neuro", "ar", "acv", "abd", "mmii"];
      ordemPadrao.forEach(sis => {
        if (exame.exame[sis]) exameTexto += `
- ${sis.toUpperCase()}: ${exame.exame[sis]}`;
      });
      Object.keys(exame.exame).forEach(sis => {
        if (!ordemPadrao.includes(sis)) exameTexto += `
- ${sis.toUpperCase()}: ${exame.exame[sis]}`;
      });
      textoFinal.push(exameTexto);
    }

    // HD
    textoFinal.push(`# HD:
${data.diagnostico}`);

    // CONDUTA
    const condutas = [];

    if (medicacaoCheck.checked && medicacaoTexto.value)
      condutas.push(`- Prescrevo medicação para uso hospitalar: ${medicacaoTexto.value}`);
    if (examesCheck.checked && examesTexto.value)
      condutas.push(`- Solicito exames: ${examesTexto.value}`);
    if (reavaliarCheck.checked) {
      if (medicacaoCheck.checked && examesCheck.checked) {
        condutas.push(`- Reavaliar paciente após exames e medicação hospitalar`);
      } else if (examesCheck.checked) {
        condutas.push(`- Reavaliar paciente após exames`);
      } else if (medicacaoCheck.checked) {
        condutas.push(`- Reavaliar paciente após medicação hospitalar`);
      }
    }

    if (document.getElementById("receitaCheck").checked)
      condutas.push("- Prescrevo medicação para uso domiciliar conforme receita entregue para o paciente e registrada no sistema de prontuário eletrônico;");
    if (document.getElementById("cuidadosCheck").checked)
      condutas.push("- Oriento cuidados em domicilio;
- Oriento sinais de alarme para procurar serviço de saúde precocemente se necessário;
- Paciente ciente e concordante com as condutas;");
    if (document.getElementById("atestadoCheck").checked)
      condutas.push("- Forneço atestado médico, com CID (solicitado e autorizado pelo paciente), entregue para o paciente e registrado no sistema de prontuário eletrônico;");

    if (encaminhamentoCheck.checked) {
      const isPS = document.querySelector('input[value="PS"]').checked;
      const isAMB = document.querySelector('input[value="AMB"]').checked;
      const esp = encaminhamentoTexto.value || "especialidade não informada";
      if (isPS) condutas.push(`- Encaminho para atendimento no PS com a especialidade de ${esp};`);
      if (isAMB) {
        condutas.push(`- Encaminho para atendimento ambulatorial com a especialidade de ${esp};`);
        document.getElementById("btnEncaminhamento").classList.remove("hidden");
      } else {
        document.getElementById("btnEncaminhamento").classList.add("hidden");
      }
    } else {
      document.getElementById("btnEncaminhamento").classList.add("hidden");
    }

    if (document.getElementById("altaCheck").checked) {
      condutas.push(medicacaoCheck.checked ? "- Alta após medicação hospitalar" : "- Alta hospitalar");
    }

    textoFinal.push(`# CONDUTA:
${condutas.join("
")}`);

    const final = textoFinal.join("

").trim();
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
  const encaminhamento = `Encaminho paciente para avaliação e seguimento ambulatorial com ${esp}.

Grato.`;
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