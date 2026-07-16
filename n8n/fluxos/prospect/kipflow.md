{
"name": "Kipflow — Fluxo",
"nodes": [
{
"parameters": {
"formTitle": "Buscar E-mail e Telefone de uma Pessoa",
"formDescription": "Cole a URL ou o Public ID do perfil LinkedIn e o ID da pessoa no Pipedrive.",
"formFields": {
"values": [
{
"fieldLabel": "LinkedIn Public ID ou URL",
"placeholder": "Ex: joao-silva-ceo ou https://www.linkedin.com/in/joao-silva-ceo",
"requiredField": true
},
{
"fieldLabel": "Pipedrive Person ID",
"placeholder": "Ex: 123"
}
]
},
"options": {}
},
"id": "b334a2b1-43b2-4e00-b753-2081d43916b6",
"name": "Form — Buscar Pessoa1",
"type": "n8n-nodes-base.formTrigger",
"typeVersion": 2.2,
"position": [
256,
-864
],
"webhookId": "dd045a86-d7b8-4341-a95b-04b976a4ccea"
},
{
"parameters": {
"resource": "contacts",
"contactsDomain": "={{ $json.data.website }}"
},
"id": "60b275b4-395e-4d74-8153-fe2e2780b83c",
"name": "Gerar Telefone da Pessoa",
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
784,
-768
],
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"resource": "contacts",
"operation": "generateEmails",
"emailsCnpj": "=",
"emailsDomain": "={{ $json.data.website }}"
},
"id": "591b9daf-7868-4617-b9c2-d7c49a15640b",
"name": "Gerar Email da Pessoa1",
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
784,
-960
],
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"jsCode": "const perfil = $('Buscar Perfil LinkedIn Empresa').first().json.data || {};\n\nconst emailsResult = $('Gerar Email da Pessoa1').first().json;\nconst telefonesResult = $('Gerar Telefone da Pessoa').first().json;\n\n// ====================\n// EMAILS\n// ====================\nconst emails = (emailsResult.data || [])\n  .map(e => e.email)\n  .filter(Boolean);\n\nconst emails_text = emails.join(', ');\n\n// ====================\n// TELEFONES\n// ====================\nconst phones = (telefonesResult.data?.phones || [])\n  .map(p => p.telefone_completo)\n  .filter(Boolean);\n\n// remove duplicados\nconst uniquePhones = [...new Set(phones)];\n\nconst phones_text = uniquePhones.join(', ');\n\nconst phones_multiline = uniquePhones.join('\\n');\n\n// ====================\n// RETURN\n// ====================\nreturn [\n  {\n    json: {\n      company_name: perfil.company_name || '',\n      website: perfil.website || '',\n\n      emails,\n      emails_text,\n\n      phones: uniquePhones,\n\n      phones_text,\n\n      phones_multiline\n    }\n  }\n];"
},
"id": "7706c1c4-5b89-49da-903f-5d8f3926fab0",
"name": "Consolidar Dados1",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
1040,
-880
]
},
{
"parameters": {
"content": "## Gerar Email + Telefone de uma Empresa atraves Linkedin ID\n",
"height": 464,
"width": 1344
},
"type": "n8n-nodes-base.stickyNote",
"position": [
144,
-1040
],
"typeVersion": 1,
"id": "57e01a01-b99e-4a56-8d3e-87780767e177",
"name": "Sticky Note",
"disabled": true
},
{
"parameters": {
"content": "## Descobrir decisores a partir do LinkedIn da empresa\n",
"height": 384,
"width": 1296
},
"type": "n8n-nodes-base.stickyNote",
"position": [
128,
-464
],
"typeVersion": 1,
"id": "b02c2c8f-b5aa-4b8c-94e6-477dc40a9614",
"name": "Sticky Note1",
"disabled": true
},
{
"parameters": {
"httpMethod": "POST",
"path": "fluxo4-lead-inbound",
"options": {}
},
"id": "eab351c2-b530-4d15-b308-c86e0e635c8a",
"name": "Webhook — Lead Inbound1",
"type": "n8n-nodes-base.webhook",
"typeVersion": 2,
"position": [
192,
208
],
"webhookId": "fluxo4-lead-inbound"
},
{
"parameters": {
"assignments": {
"assignments": [
{
"id": "1",
"name": "person_id",
"value": "={{ $json.body.data.person_id }}",
"type": "string"
},
{
"id": "2",
"name": "org_id",
"value": "={{ $json.body.data.org_id }}",
"type": "string"
},
{
"id": "3",
"name": "deal_id",
"value": "={{ $json.body.data.id }}",
"type": "string"
}
]
},
"options": {}
},
"id": "634b1295-0d96-454f-96ae-06c209dc60f8",
"name": "Extrair IDs do Evento1",
"type": "n8n-nodes-base.set",
"typeVersion": 3.4,
"position": [
416,
208
]
},
{
"parameters": {
"url": "=https://api.pipedrive.com/v1/persons/{{ $json.person_id }}",
"sendHeaders": true,
"headerParameters": {
"parameters": [
{
"name": "x-api-token",
"value": "REDACTED_PIPEDRIVE_API_TOKEN"
}
]
},
"options": {}
},
"id": "05c69315-4139-4c70-9e18-260abf59f6a0",
"name": "Buscar Pessoa no Pipedrive1",
"type": "n8n-nodes-base.httpRequest",
"typeVersion": 4.2,
"position": [
640,
208
]
},
{
"parameters": {
"jsCode": "\nconst pessoa = $input.item.json.data || {};\nconst emails = pessoa.email || [];\n\n// Pipedrive retorna array de emails: [{ value: \"...\", primary: true }]\nconst emailObj = emails.find(e => e.primary) || emails[0];\nconst email = (emailObj?.value || '').trim().toLowerCase();\n\nconst person_id = String($('Extrair IDs do Evento1').item.json.person_id || '');\nconst org_id = String($('Extrair IDs do Evento1').item.json.org_id || '');\nconst deal_id = String($('Extrair IDs do Evento1').item.json.deal_id || '');\nconst nome = pessoa.name || '';\n\nif (!email || !email.includes('@')) {\n  return [{ json: { erro: 'Pessoa sem email cadastrado.', person_id, org_id } }];\n}\n\nconst dominiosPessoais = [\n  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com',\n  'live.com', 'bol.com.br', 'ig.com.br', 'terra.com.br', 'uol.com.br',\n  'protonmail.com', 'me.com',\n];\n\nconst domain = email.split('@')[1];\n\nif (dominiosPessoais.includes(domain)) {\n  return [{ json: { erro: 'Email pessoal — não é possível enriquecer.', domain, email, person_id, org_id } }];\n}\n\nreturn [{\n  json: { email, domain, nome, person_id, org_id, deal_id }\n}];\n      "
},
"id": "fbcc2e1f-8d21-4984-912c-6006cd4b28f9",
"name": "Extrair Domínio do Email1",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
864,
208
]
},
{
"parameters": {
"content": "## Inbound Coletar Faturamento + Enrichment a partir de DOMINIO E-mail\n\n",
"height": 432,
"width": 2064
},
"type": "n8n-nodes-base.stickyNote",
"position": [
112,
48
],
"typeVersion": 1,
"id": "7d8a138b-8d93-4f35-a0d9-6d84efea0a10",
"name": "Sticky Note2",
"disabled": true
},
{
"parameters": {
"formTitle": "Buscar E-mail e Telefone de uma Pessoa",
"formDescription": "Cole a URL ou o Public ID do perfil LinkedIn e o ID da pessoa no Pipedrive.",
"formFields": {
"values": [
{
"fieldLabel": "LinkedIn Public ID ou URL",
"placeholder": "Ex: joao-silva-ceo ou https://www.linkedin.com/in/joao-silva-ceo",
"requiredField": true
},
{
"fieldLabel": "Pipedrive Person ID",
"placeholder": "Ex: 123"
}
]
},
"options": {}
},
"id": "7af7356e-c739-4478-9772-99807244dc8e",
"name": "Form — Buscar Pessoa",
"type": "n8n-nodes-base.formTrigger",
"typeVersion": 2.2,
"position": [
1728,
-864
],
"webhookId": "58a2bb76-5492-448b-89a6-37ab05f2fe23"
},
{
"parameters": {
"content": "## Gerar Email  de uma  Pessoa atraves Linkedin ID\n",
"height": 464,
"width": 688
},
"type": "n8n-nodes-base.stickyNote",
"position": [
1568,
-1040
],
"typeVersion": 1,
"id": "22a32e92-b482-4e1b-b84c-00c4035cab7f",
"name": "Sticky Note3",
"disabled": true
},
{
"parameters": {
"resource": "social",
"companyPublicId": "={{ $json[\"LinkedIn Public ID ou URL\"] }}"
},
"id": "d9496727-d7ac-4bf1-b3db-d77d1643040b",
"name": "Buscar Perfil LinkedIn Empresa",
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
512,
-864
],
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"url": "https://api.kipflow.io/contacts/v1/emails/profile",
"sendQuery": true,
"queryParameters": {
"parameters": [
{
"name": "linkedin_id",
"value": "={{ $json[\"LinkedIn Public ID ou URL\"] }}"
}
]
},
"sendHeaders": true,
"headerParameters": {
"parameters": [
{
"name": "X-API-Key",
"value": "REDACTED_KIPFLOW_API_KEY_1"
}
]
},
"options": {
"redirect": {
"redirect": {}
}
}
},
"type": "n8n-nodes-base.httpRequest",
"typeVersion": 4.4,
"position": [
1984,
-864
],
"id": "35fb4e87-bddc-4c5c-94dc-bb1786c1ba2a",
"name": "Gerar email de uma pessoa a partir do LinkedIn ID"
},
{
"parameters": {
"method": "POST",
"url": "https://api.kipflow.io/social/v1/people/search",
"sendHeaders": true,
"headerParameters": {
"parameters": [
{
"name": "X-API-Key",
"value": "REDACTED_KIPFLOW_API_KEY_2"
},
{
"name": "Content-Type",
"value": "application/json"
}
]
},
"sendBody": true,
"specifyBody": "json",
"jsonBody": "={{\nJSON.stringify((() => {\n  const rawCompany = String($json['LinkedIn Company Public ID ou URL'] || '').trim();\n  const seniorityRaw = String($json['Senioridade'] || '').trim();\n  const areaRaw = String($json['Área'] || '').trim();\n  const prioritize = $json['Priorizar decisores?'] === 'Sim';\n  const size = Math.min(Number($json['Quantidade de contatos'] || 5), 50);\n\n  const companyPublicId = rawCompany\n    .replace('https://www.linkedin.com/company/', '')\n    .replace('https://linkedin.com/company/', '')\n    .replace('http://www.linkedin.com/company/', '')\n    .replace('http://linkedin.com/company/', '')\n    .replace(/\\?.*$/, '')\n    .replace(/\\/$/, '')\n    .trim();\n\n  const filters = [];\n\n  if (seniorityRaw) {\n    filters.push({ seniority: { $in: [seniorityRaw] } });\n  } else if (prioritize) {\n    filters.push({\n      seniority: {\n        $in: ['C-SUITE / DIRETOR', 'GERENTE', 'COORDENADOR']\n      }\n    });\n  }\n\n  if (areaRaw) {\n    filters.push({ area: { $in: [areaRaw] } });\n  }\n\n  const body = {\n    $companies_filter: {\n      $and: [\n        {\n          $or: [\n            {\n              company_public_id: companyPublicId\n            }\n          ]\n        }\n      ]\n    },\n    $sort: [\n      {\n        seniority_order: {\n          $order: 'desc'\n        }\n      },\n      {\n        first_name: {\n          $order: 'asc'\n        }\n      },\n      {\n        profile_id: {\n          $order: 'asc'\n        }\n      }\n    ],\n    $page: 0,\n    $size: size\n  };\n\n  if (filters.length) {\n    body.$filter = { $and: filters };\n  }\n\n  return body;\n})())\n}}",
"options": {}
},
"id": "7153db66-9750-42aa-93bc-de9872659a03",
"name": "Kipflow — Buscar Pessoas LinkedIn",
"type": "n8n-nodes-base.httpRequest",
"typeVersion": 4.4,
"position": [
448,
-320
]
},
{
"parameters": {
"jsCode": "const response = $input.first().json;\nconst form = $('Form — Buscar Decisores1').first().json;\n\nconst pessoas = Array.isArray(response.data) ? response.data : [];\n\nreturn pessoas.map((pessoa) => {\n  return {\n    json: {\n      pessoa,\n      profile_public_id: pessoa.profile_public_id || '',\n      linkedin_url: pessoa.profile_public_id\n        ? `https://www.linkedin.com/in/${pessoa.profile_public_id}`\n        : pessoa.profile_url || '',\n      pipedrive_org_id: form['Pipedrive Org ID'] || '',\n      search_company_input: form['LinkedIn Company Public ID ou URL'] || ''\n    }\n  };\n});"
},
"id": "e3fcb304-4436-45be-b8dc-0a1cfcc8fe44",
"name": "Code — Extrair Pessoas",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
672,
-320
]
},
{
"parameters": {
"url": "=https://api.kipflow.io/contacts/v1/emails/profile?linkedin_id={{ $json.profile_public_id }}",
"sendHeaders": true,
"headerParameters": {
"parameters": [
{
"name": "X-API-Key",
"value": "REDACTED_KIPFLOW_API_KEY_2"
}
]
},
"options": {}
},
"id": "1b8567b7-864d-4b65-8903-14d75ee8c2fc",
"name": "Kipflow — Gerar Email do Decisor",
"type": "n8n-nodes-base.httpRequest",
"typeVersion": 4.4,
"position": [
896,
-320
]
},
{
"parameters": {
"mode": "runOnceForEachItem",
"jsCode": "const pessoaItem = $('Code — Extrair Pessoas').item.json;\nconst pessoa = pessoaItem.pessoa || {};\nconst emailResult = $input.item.json;\n\nconst emailData = Array.isArray(emailResult.data)\n  ? emailResult.data[0] || {}\n  : {};\n\nconst linkedin = pessoa.profile_public_id\n  ? `https://www.linkedin.com/in/${pessoa.profile_public_id}`\n  : pessoa.profile_url || pessoaItem.linkedin_url || '';\n\nlet decision_maker_score = 0;\n\nconst seniority = String(pessoa.seniority || emailData.seniority || '').toUpperCase();\nconst jobTitle = String(pessoa.current_job_title || '').toUpperCase();\n\nif (\n  seniority.includes('C-SUITE') ||\n  jobTitle.includes('CEO') ||\n  jobTitle.includes('FOUNDER') ||\n  jobTitle.includes('FUNDADOR') ||\n  jobTitle.includes('DIRETOR') ||\n  jobTitle.includes('DIRECTOR')\n) {\n  decision_maker_score = 100;\n} else if (\n  jobTitle.includes('VP') ||\n  jobTitle.includes('VICE PRESIDENTE') ||\n  jobTitle.includes('VICE PRESIDENT')\n) {\n  decision_maker_score = 90;\n} else if (\n  seniority.includes('GERENTE') ||\n  jobTitle.includes('GERENTE') ||\n  jobTitle.includes('MANAGER') ||\n  jobTitle.includes('HEAD')\n) {\n  decision_maker_score = 75;\n} else if (\n  seniority.includes('COORDENADOR') ||\n  jobTitle.includes('COORDENADOR') ||\n  jobTitle.includes('COORDINATOR')\n) {\n  decision_maker_score = 60;\n} else {\n  decision_maker_score = 40;\n}\n\nconst emailValidation = String(emailData.validation || '').toUpperCase();\n\nlet email_quality = 'desconhecido';\n\nif (\n  ['ENTREGAVEL', 'ENTREGÁVEL', 'VALIDO', 'VÁLIDO', 'VALIDADO', 'VALID'].includes(emailValidation)\n) {\n  email_quality = 'bom';\n} else if (emailValidation.includes('ARRISCADO') || emailValidation.includes('RISKY')) {\n  email_quality = 'arriscado';\n} else if (emailValidation.includes('INVALID') || emailValidation.includes('INVÁLIDO')) {\n  email_quality = 'ruim';\n}\n\nreturn {\n  json: {\n    company_name: pessoa.current_company || '',\n    company_public_id: pessoa.current_company_public_id || '',\n    company_url: pessoa.current_company_url || '',\n\n    full_name:\n      pessoa.full_name ||\n      emailData.full_name ||\n      `${pessoa.first_name || ''} ${pessoa.last_name || ''}`.trim(),\n\n    first_name: pessoa.first_name || '',\n    last_name: pessoa.last_name || '',\n\n    current_job_title: pessoa.current_job_title || '',\n    seniority: pessoa.seniority || emailData.seniority || '',\n    area: pessoa.area || emailData.area || '',\n\n    city: pessoa.city || '',\n    state: pessoa.state || '',\n    country: pessoa.country || '',\n\n    profile_id: pessoa.profile_id || '',\n    profile_public_id: pessoa.profile_public_id || '',\n    linkedin_url: linkedin,\n    profile_image_url: pessoa.profile_image_url || '',\n\n    email: emailData.email || '',\n    email_validation: emailData.validation || '',\n    email_quality,\n\n    decision_maker_score,\n\n    experience: pessoa.experience || [],\n    education: pessoa.education || [],\n\n    pipedrive_org_id: pessoaItem.pipedrive_org_id || '',\n\n    kipflow_email_cost: emailResult?.pricing?.adjustedCost || emailResult?.pricing?.baseCost || '',\n    kipflow_email_cost_formatted: emailResult?.pricing?.adjustedCostFormatted || emailResult?.pricing?.baseCostFormatted || ''\n  }\n};"
},
"id": "b1f82928-5f60-47f4-83f5-00a65862b04b",
"name": "Code — Consolidar Decisor",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
1120,
-320
]
},
{
"parameters": {
"formTitle": "Buscar Decisores no LinkedIn",
"formDescription": "Busca decisores de uma empresa via Kipflow.",
"formFields": {
"values": [
{
"fieldLabel": "LinkedIn Company Public ID ou URL",
"placeholder": "Ex: magazineluiza ou https://www.linkedin.com/company/magazineluiza/",
"requiredField": true
},
{
"fieldLabel": "Senioridade",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "C-SUITE / DIRETOR"
},
{
"option": "GERENTE"
},
{
"option": "COORDENADOR"
},
{
"option": "SUPERVISOR"
},
{
"option": "ESPECIALISTA"
},
{
"option": "ANALISTA"
},
{
"option": "ESTAGIARIO / TRAINEE"
},
{
"option": "OUTROS"
}
]
}
},
{
"fieldLabel": "Área",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "VENDAS"
},
{
"option": "MARKETING"
},
{
"option": "NOVOS NEGÓCIOS"
},
{
"option": "INTELIGÊNCIA DE MERCADO"
},
{
"option": "TECNOLOGIA"
},
{
"option": "DADOS"
},
{
"option": "DESENVOLVIMENTO"
},
{
"option": "PRODUTOS"
},
{
"option": "INOVAÇÃO"
},
{
"option": "FINANCEIRO"
},
{
"option": "RECURSOS HUMANOS"
},
{
"option": "OPERAÇÕES"
},
{
"option": "ATENDIMENTO AO CLIENTE"
},
{
"option": "COMPRAS"
},
{
"option": "ADMINISTRATIVO"
}
]
}
},
{
"fieldLabel": "Quantidade de contatos",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{
"option": "5"
},
{
"option": "10"
},
{
"option": "20"
},
{
"option": "50"
}
]
}
},
{
"fieldLabel": "Priorizar decisores?",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{
"option": "Sim"
},
{
"option": "Não"
}
]
}
},
{
"fieldLabel": "Pipedrive Org ID",
"placeholder": "Opcional"
}
]
},
"options": {}
},
"id": "19abafbb-2bb7-4da0-9b20-1475517bf20f",
"name": "Form — Buscar Decisores1",
"type": "n8n-nodes-base.formTrigger",
"typeVersion": 2.2,
"position": [
224,
-320
],
"webhookId": "82fe8db7-9fc8-4d74-a35c-2bff85cf7273"
},
{
"parameters": {
"resource": "organization",
"operation": "update",
"organizationId": "={{ $json.org_id }}",
"updateFields": {
"customFields": {
"property": [
{
"name": "8001f12c512800890a4a13074b07fa09df44ca78",
"value": "={{ $json.faixa_faturamento }}"
},
{
"name": "9014974a95da0d5a3617cb00efa9239d1f56b97b",
"value": "={{ $json.nota_decisores }}"
}
]
}
}
},
"type": "n8n-nodes-base.pipedrive",
"typeVersion": 2,
"position": [
1968,
208
],
"id": "ecc5f5f2-2a5d-4cfa-9093-dc9f66182dea",
"name": "Update an organization2",
"credentials": {
"pipedriveApi": {
"id": "81lWRGEBDRjb3aTY",
"name": "Pipedrive account"
}
}
},
{
"parameters": {
"domain": "={{ $json.domain }}",
"datasets": [
"basic",
"complete",
"address",
"online_presence",
"partners",
"debts"
]
},
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
1088,
208
],
"id": "89c53de7-aa10-4f18-8902-360762e69f43",
"name": "Enrichment — Empresa por Domínio",
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"assignments": {
"assignments": [
{
"id": "1",
"name": "email",
"value": "={{ $('Extrair Domínio do Email1').first().json.email }}\n",
"type": "string"
},
{
"id": "2",
"name": "domain",
"value": "={{ $('Extrair Domínio do Email1').first().json.domain }}",
"type": "string"
},
{
"id": "3",
"name": "nome_lead",
"value": "={{ $('Extrair Domínio do Email1').first().json.nome }}",
"type": "string"
},
{
"id": "4",
"name": "person_id",
"value": "={{ $('Extrair Domínio do Email1').first().json.person_id }}",
"type": "string"
},
{
"id": "5",
"name": "org_id",
"value": "={{ $('Extrair Domínio do Email1').first().json.org_id }}",
"type": "string"
},
{
"id": "6",
"name": "deal_id",
"value": "={{ $('Extrair Domínio do Email1').first().json.deal_id }}",
"type": "string"
},
{
"id": "7",
"name": "cnpj",
"value": "={{ $json.data?.cnpj || \"\" }}",
"type": "string"
},
{
"id": "8",
"name": "razao_social",
"value": "={{ $json.data?.razao_social || \"\" }}",
"type": "string"
},
{
"id": "9",
"name": "nome_fantasia",
"value": "={{ $json.data?.nome_fantasia || $json.data?.razao_social || \"\" }}",
"type": "string"
},
{
"id": "10",
"name": "situacao_cadastral",
"value": "={{ $json.data?.situacao_cadastral || \"\" }}",
"type": "string"
},
{
"id": "11",
"name": "porte",
"value": "={{ $json.data?.porte || \"\" }}",
"type": "string"
},
{
"id": "12",
"name": "faixa_faturamento",
"value": "={{ $json.data?.faixa_faturamento_grupo || \"\" }}",
"type": "string"
},
{
"id": "13",
"name": "faixa_funcionarios",
"value": "={{ $json.data?.faixa_funcionarios_grupo || \"\" }}",
"type": "string"
},
{
"id": "14",
"name": "segmento",
"value": "={{ $json.data?.segmento || \"\" }}",
"type": "string"
},
{
"id": "15",
"name": "cnae_principal",
"value": "={{ $json.data?.cnae_principal_desc_classe || \"\" }}",
"type": "string"
},
{
"id": "16",
"name": "endereco",
"value": "={{ $json.data?.endereco || \"\" }}",
"type": "string"
},
{
"id": "17",
"name": "municipio",
"value": "={{ $json.data?.municipio || \"\" }}",
"type": "string"
},
{
"id": "18",
"name": "uf",
"value": "={{ $json.data?.uf || \"\" }}",
"type": "string"
},
{
"id": "19",
"name": "linkedin_url",
"value": "={{ $json.data?.linkedin_url || \"\" }}",
"type": "string"
},
{
"id": "20",
"name": "website",
"value": "={{ $json.data?.sites?.[0]?.site || \"\" }}",
"type": "string"
},
{
"id": "21",
"name": "telefone",
"value": "={{ $json.data?.telefones?.[0]?.telefone_completo || \"\" }}",
"type": "string"
},
{
"id": "22",
"name": "socios",
"value": "={{ JSON.stringify($json.data?.socios || []) }}",
"type": "string"
}
]
},
"options": {}
},
"id": "ea6d31ea-f4c8-4fdf-965a-21d68daebd05",
"name": "Extrair Dados da Empresa",
"type": "n8n-nodes-base.set",
"typeVersion": 3.4,
"position": [
1312,
208
]
},
{
"parameters": {
"resource": "contacts",
"operation": "generateEmails",
"emailsDomain": "={{ $json.domain }}"
},
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
1536,
208
],
"id": "3d4e635e-a30f-45f7-a747-40f7534c0d58",
"name": "GenerateEmails contacts",
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"jsCode": "const emailResult = $input.first().json;\n\n// Dados do lead original\nlet dadosLead = {};\ntry {\n  dadosLead = $('Extrair Domínio do Email1').first().json;\n} catch (e) {\n  dadosLead = {};\n}\n\n// Dados da empresa enriquecida\nlet dadosEmpresa = {};\ntry {\n  dadosEmpresa = $('Extrair Dados da Empresa').first().json;\n} catch (e) {\n  dadosEmpresa = {};\n}\n\nconst empresa = {\n  ...dadosLead,\n  ...dadosEmpresa\n};\n\nconst decisores = Array.isArray(emailResult.data) ? emailResult.data : [];\n\nconst emailsUnicos = new Set();\n\nconst decisoresLimpos = decisores.filter(d => {\n  if (!d.email) return false;\n\n  const email = String(d.email).toLowerCase().trim();\n\n  if (emailsUnicos.has(email)) return false;\n\n  emailsUnicos.add(email);\n  return true;\n});\n\nconst ordemSenioridade = {\n  'C-SUITE / DIRETOR': 1,\n  'VP': 2,\n  'GERENTE': 3,\n  'COORDENADOR': 4,\n  'SUPERVISOR': 5,\n  'ESPECIALISTA': 6,\n  'ANALISTA': 7,\n  'OUTROS': 8,\n};\n\ndecisoresLimpos.sort((a, b) => {\n  return (ordemSenioridade[a.seniority] || 999) - (ordemSenioridade[b.seniority] || 999);\n});\n\nconst topDecisores = decisoresLimpos.slice(0, 5);\n\nconst notaDecisores = topDecisores.map((d, index) => {\n  return `${index + 1}. ${d.full_name || ''}\n\nCargo: ${d.seniority || ''}\nÁrea: ${d.area || ''}\nEmail: ${d.email || ''}\nValidação: ${d.validation || ''}`;\n}).join('\\n\\n------------------\\n\\n');\n\nreturn [\n  {\n    json: {\n      email: empresa.email || '',\n      domain: empresa.domain || '',\n      nome_lead: empresa.nome_lead || empresa.nome || '',\n      person_id: empresa.person_id || '',\n      org_id: empresa.org_id || '',\n      deal_id: empresa.deal_id || '',\n\n      cnpj: empresa.cnpj || '',\n      razao_social: empresa.razao_social || '',\n      nome_fantasia: empresa.nome_fantasia || '',\n      situacao_cadastral: empresa.situacao_cadastral || '',\n      porte: empresa.porte || '',\n      faixa_faturamento: empresa.faixa_faturamento || '',\n      faixa_funcionarios: empresa.faixa_funcionarios || '',\n      segmento: empresa.segmento || '',\n      cnae_principal: empresa.cnae_principal || '',\n      endereco: empresa.endereco || '',\n      municipio: empresa.municipio || '',\n      uf: empresa.uf || '',\n      linkedin_url: empresa.linkedin_url || '',\n      website: empresa.website || '',\n      telefone: empresa.telefone || '',\n      socios: empresa.socios || '[]',\n\n      decisores_limpos: decisoresLimpos,\n      top_decisores: topDecisores,\n      nota_decisores: notaDecisores,\n\n      kipflow_success: emailResult.success || false,\n      kipflow_pricing: emailResult.pricing || {}\n    }\n  }\n];"
},
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
1760,
208
],
"id": "e9d5f857-905b-417f-bf70-f8b069a0e44e",
"name": "Formatar Lista"
},
{
"parameters": {
"formTitle": "Criar Lista de Empresas",
"formDescription": "Busque empresas brasileiras usando filtros da Kipflow.",
"formFields": {
"values": [
{
"fieldLabel": "UF",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "SAO PAULO"
},
{
"option": "RIO DE JANEIRO"
},
{
"option": "MINAS GERAIS"
},
{
"option": "PARANA"
},
{
"option": "SANTA CATARINA"
},
{
"option": "RIO GRANDE DO SUL"
},
{
"option": "BAHIA"
},
{
"option": "PERNAMBUCO"
},
{
"option": "GOIAS"
},
{
"option": "DISTRITO FEDERAL"
}
]
}
},
{
"fieldLabel": "Município",
"placeholder": "Ex: SAO PAULO, CURITIBA, RIO DE JANEIRO"
},
{
"fieldLabel": "Segmento",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "SERVICOS"
},
{
"option": "COMERCIO"
},
{
"option": "INDUSTRIA"
}
]
}
},
{
"fieldLabel": "Porte",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "MICRO EMPRESA"
},
{
"option": "EMPRESA DE PEQUENO PORTE"
},
{
"option": "DEMAIS"
}
]
}
},
{
"fieldLabel": "Faixa de faturamento",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "360K A 1M"
},
{
"option": "1M A 2M"
},
{
"option": "2M A 5M"
},
{
"option": "5M A 10M"
},
{
"option": "10M A 20M"
},
{
"option": "20M A 30M"
},
{
"option": "30M A 40M"
},
{
"option": "40M A 50M"
},
{
"option": "50M A 100M"
}
]
}
},
{
"fieldLabel": "Faixa de funcionários",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "01 A 05"
},
{
"option": "06 A 09"
},
{
"option": "10 A 19"
},
{
"option": "20 A 49"
},
{
"option": "50 A 99"
},
{
"option": "100 A 249"
},
{
"option": "250 A 499"
},
{
"option": "500 A 999"
},
{
"option": "1000 OU MAIS"
}
]
}
},
{
"fieldLabel": "Matriz?",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{},
{
"option": "Sim"
},
{
"option": "Não"
}
]
}
},
{
"fieldLabel": "Somente empresas ativas?",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{
"option": "Sim"
},
{
"option": "Não"
}
]
}
},
{
"fieldLabel": "Quantidade de empresas",
"fieldType": "dropdown",
"fieldOptions": {
"values": [
{
"option": "5"
},
{
"option": "10"
},
{
"option": "20"
},
{
"option": "50"
}
]
}
}
]
},
"options": {}
},
"id": "cbcb7e06-493c-4a18-aea6-e18b79fbc48e",
"name": "Form — Criar Lista de Empresas",
"type": "n8n-nodes-base.formTrigger",
"typeVersion": 2.2,
"position": [
256,
720
],
"webhookId": "14d1480b-fea9-433d-ba5a-10e8aa99f4de"
},
{
"parameters": {
"method": "POST",
"url": "https://api.kipflow.io/companies/v1/search",
"sendHeaders": true,
"headerParameters": {
"parameters": [
{
"name": "X-API-Key",
"value": "REDACTED_KIPFLOW_API_KEY_2"
},
{
"name": "Content-Type",
"value": "application/json"
}
]
},
"sendBody": true,
"specifyBody": "json",
"jsonBody": "={{\nJSON.stringify((() => {\n  const uf = String($json['UF'] || '').trim();\n  const municipio = String($json['Município'] || '').trim();\n  const segmento = String($json['Segmento'] || '').trim();\n  const porte = String($json['Porte'] || '').trim();\n  const faixaFaturamento = String($json['Faixa de faturamento'] || '').trim();\n  const faixaFuncionarios = String($json['Faixa de funcionários'] || '').trim();\n  const matrizRaw = String($json['Matriz?'] || '').trim();\n  const somenteAtivas = String($json['Somente empresas ativas?'] || '').trim();\n  const size = Math.min(Number($json['Quantidade de empresas'] || 10), 50);\n\n  const filters = [];\n\n  if (somenteAtivas === 'Sim') {\n    filters.push({ situacao_cadastral: 'ATIVA' });\n  }\n\n  if (uf) {\n    filters.push({ uf });\n  }\n\n  if (municipio) {\n    filters.push({ municipio: municipio.toUpperCase() });\n  }\n\n  if (segmento) {\n    filters.push({ segmento });\n  }\n\n  if (porte) {\n    filters.push({ porte });\n  }\n\n  if (faixaFaturamento) {\n    filters.push({ faixa_faturamento_grupo: faixaFaturamento });\n  }\n\n  if (faixaFuncionarios) {\n    filters.push({ faixa_funcionarios_grupo: faixaFuncionarios });\n  }\n\n  if (matrizRaw === 'Sim') {\n    filters.push({ matriz: true });\n  }\n\n  if (matrizRaw === 'Não') {\n    filters.push({ matriz: false });\n  }\n\n  const body = {\n    $page: 0,\n    $size: size,\n    datasets: [\n      'basic',\n      'complete',\n      'address',\n      'online_presence',\n      'partners'\n    ]\n  };\n\n  if (filters.length > 0) {\n    body.$filter = {\n      $and: filters\n    };\n  }\n\n  return body;\n})())\n}}",
"options": {}
},
"id": "ac1b70bb-e113-4275-802c-7b24cc9eb580",
"name": "Kipflow — Buscar Empresas com Filtros",
"type": "n8n-nodes-base.httpRequest",
"typeVersion": 4.4,
"position": [
576,
720
]
},
{
"parameters": {
"jsCode": "const response = $input.first().json;\n\nconst empresas = Array.isArray(response.data) ? response.data : [];\n\nconst listaEmpresas = empresas.map((empresa, index) => {\n  const site = Array.isArray(empresa.sites) && empresa.sites.length > 0\n    ? empresa.sites[0].site || ''\n    : '';\n\n  const telefone = Array.isArray(empresa.telefones) && empresa.telefones.length > 0\n    ? empresa.telefones[0].telefone_completo || ''\n    : '';\n\n  const socios = Array.isArray(empresa.socios)\n    ? empresa.socios.map(s => s.nome_socio).filter(Boolean).join(', ')\n    : '';\n\n  return {\n    index: index + 1,\n    cnpj: empresa.cnpj ? String(empresa.cnpj) : '',\n    razao_social: empresa.razao_social || '',\n    nome_fantasia: empresa.nome_fantasia || empresa.razao_social || '',\n    situacao_cadastral: empresa.situacao_cadastral || '',\n    porte: empresa.porte || '',\n    segmento: empresa.segmento || '',\n    faixa_faturamento: empresa.faixa_faturamento_grupo || '',\n    faixa_funcionarios: empresa.faixa_funcionarios_grupo || '',\n    faturamento_estimado: empresa.faturamento || '',\n    cnae_principal: empresa.cnae_principal_desc_classe || '',\n    municipio: empresa.municipio || '',\n    uf: empresa.uf || '',\n    endereco: empresa.endereco || '',\n    linkedin_url: empresa.linkedin_url || '',\n    website: site,\n    telefone,\n    socios\n  };\n});\n\nconst notaLista = listaEmpresas.map(e => {\n  return `${e.index}. ${e.nome_fantasia || e.razao_social}\n\nCNPJ: ${e.cnpj}\nRazão social: ${e.razao_social}\nSituação: ${e.situacao_cadastral}\nPorte: ${e.porte}\nSegmento: ${e.segmento}\nFaturamento: ${e.faixa_faturamento}\nFuncionários: ${e.faixa_funcionarios}\nCNAE: ${e.cnae_principal}\nCidade/UF: ${e.municipio} - ${e.uf}\nSite: ${e.website}\nLinkedIn: ${e.linkedin_url}\nTelefone: ${e.telefone}\nSócios: ${e.socios}`;\n}).join('\\n\\n------------------\\n\\n');\n\nreturn [\n  {\n    json: {\n      success: response.success || false,\n      total_empresas: listaEmpresas.length,\n      pagination: response.pagination || {},\n      cost: response.cost || response.pricing?.adjustedCost || '',\n      costFormatted: response.costFormatted || response.pricing?.adjustedCostFormatted || '',\n      empresas: listaEmpresas,\n      nota_lista_empresas: notaLista\n    }\n  }\n];"
},
"id": "044c7b5c-aafb-468b-aa1a-3fcd63e06e23",
"name": "Code — Formatar Lista de Empresas",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
896,
720
]
},
{
"parameters": {
"fieldToSplitOut": "empresas",
"options": {}
},
"id": "51ddd7ff-847c-4d81-9146-55b276b187bc",
"name": "Split Out — Empresas",
"type": "n8n-nodes-base.splitOut",
"typeVersion": 1,
"position": [
1216,
720
]
},
{
"parameters": {
"content": "## Criar lista de empresas a partir de Filtros\n\n",
"height": 384,
"width": 1360
},
"type": "n8n-nodes-base.stickyNote",
"position": [
128,
576
],
"typeVersion": 1,
"id": "63d8c9f1-6794-4c95-916c-274517077d9d",
"name": "Sticky Note4",
"disabled": true
},
{
"parameters": {
"formTitle": "Analisar Risco Comercial / Compliance",
"formDescription": "Informe um e-mail corporativo ou domínio para consultar a empresa na Kipflow e gerar uma análise de risco comercial.",
"formFields": {
"values": [
{
"fieldLabel": "Email ou domínio",
"placeholder": "Ex: contato@empresa.com.br ou empresa.com.br",
"requiredField": true
},
{
"fieldLabel": "Nome do lead",
"placeholder": "Opcional"
},
{
"fieldLabel": "Pipedrive Org ID",
"placeholder": "Opcional"
},
{
"fieldLabel": "Pipedrive Person ID",
"placeholder": "Opcional"
},
{
"fieldLabel": "Pipedrive Deal ID",
"placeholder": "Opcional"
}
]
},
"options": {}
},
"id": "da286e86-3e22-41e6-830b-56baa20998a1",
"name": "Form — Risco Comercial",
"type": "n8n-nodes-base.formTrigger",
"typeVersion": 2.2,
"position": [
0,
1264
],
"webhookId": "07ecbe24-c462-42ff-8c50-3981b5c03fa2"
},
{
"parameters": {
"jsCode": "const item = $input.first().json;\n\nconst rawInput = String(item['Email ou domínio'] || '').trim().toLowerCase();\n\nconst freeDomains = [\n  'gmail.com',\n  'hotmail.com',\n  'outlook.com',\n  'yahoo.com',\n  'icloud.com',\n  'live.com',\n  'bol.com.br',\n  'uol.com.br',\n  'terra.com.br'\n];\n\nlet domain = rawInput;\nlet email = '';\n\nif (rawInput.includes('@')) {\n  email = rawInput;\n  domain = rawInput.split('@').pop().trim();\n}\n\ndomain = domain\n  .replace('https://www.', '')\n  .replace('http://www.', '')\n  .replace('https://', '')\n  .replace('http://', '')\n  .replace('www.', '')\n  .split('/')[0]\n  .split('?')[0]\n  .trim();\n\nconst isFreeEmailDomain = freeDomains.includes(domain);\n\nreturn [\n  {\n    json: {\n      email,\n      domain,\n      nome_lead: item['Nome do lead'] || '',\n      org_id: item['Pipedrive Org ID'] || '',\n      person_id: item['Pipedrive Person ID'] || '',\n      deal_id: item['Pipedrive Deal ID'] || '',\n      is_free_email_domain: isFreeEmailDomain,\n      status_validacao_dominio: isFreeEmailDomain\n        ? 'DOMINIO_PESSOAL_NAO_RECOMENDADO'\n        : 'DOMINIO_CORPORATIVO_OK'\n    }\n  }\n];"
},
"id": "646172b4-c4b8-4547-b065-139cfc0a8b0c",
"name": "Code — Extrair Domínio",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
288,
1264
]
},
{
"parameters": {
"conditions": {
"options": {
"caseSensitive": true,
"leftValue": "",
"typeValidation": "strict",
"version": 2
},
"conditions": [
{
"id": "dominio-corporativo",
"leftValue": "={{ $json.is_free_email_domain }}",
"rightValue": false,
"operator": {
"type": "boolean",
"operation": "equals"
}
}
],
"combinator": "and"
},
"options": {}
},
"id": "a40c85a2-419d-4ec4-a3ba-cc55ee4d4fb2",
"name": "IF — Domínio Corporativo?",
"type": "n8n-nodes-base.if",
"typeVersion": 2.2,
"position": [
560,
1264
]
},
{
"parameters": {
"domain": "={{ $json.domain }}",
"datasets": [
"basic",
"complete",
"address",
"online_presence",
"partners",
"debts"
]
},
"id": "c5079db1-5231-410e-b3a5-c206ff307326",
"name": "Kipflow — Enriquecer Empresa para Risco",
"type": "n8n-nodes-kipflow.kipflowCnpjEnrichment",
"typeVersion": 1,
"position": [
848,
1152
],
"credentials": {
"kipflowApi": {
"id": "ffwUBdUnq4FuXG3g",
"name": "Kipflow account 2"
}
}
},
{
"parameters": {
"jsCode": "const enrichment = $input.first().json;\nconst lead = $('Code — Extrair Domínio').first().json;\n\nconst empresa = enrichment.data || {};\nconst divida = empresa.divida || {};\n\nconst totalDivida = Number(\n  divida.total ||\n  divida.total_nao_previdenciaria ||\n  divida.total_previdenciaria ||\n  0\n);\n\nconst sites = Array.isArray(empresa.sites) ? empresa.sites : [];\nconst telefones = Array.isArray(empresa.telefones) ? empresa.telefones : [];\nconst socios = Array.isArray(empresa.socios) ? empresa.socios : [];\n\nlet riscoScore = 0;\nconst motivos = [];\nconst pontosPositivos = [];\n\n// =========================\n// SITUAÇÃO CADASTRAL\n// =========================\n\nconst situacao = String(empresa.situacao_cadastral || '').toUpperCase();\n\nif (!situacao) {\n  riscoScore += 15;\n  motivos.push('Situação cadastral não encontrada.');\n} else if (situacao !== 'ATIVA') {\n  riscoScore += 45;\n  motivos.push(`Situação cadastral diferente de ATIVA: ${empresa.situacao_cadastral}.`);\n} else {\n  pontosPositivos.push('Empresa com situação cadastral ATIVA.');\n}\n\n// =========================\n// PORTE / FATURAMENTO\n// =========================\n\nconst faixaFaturamento = String(empresa.faixa_faturamento_grupo || '').toUpperCase();\nconst faixaFuncionarios = String(empresa.faixa_funcionarios_grupo || '').toUpperCase();\nconst faturamento = Number(empresa.faturamento_grupo || empresa.faturamento || 0);\n\nif (!faixaFaturamento && !faturamento) {\n  riscoScore += 10;\n  motivos.push('Faturamento estimado não encontrado.');\n} else if (\n  faixaFaturamento.includes('360K') ||\n  faturamento > 0 && faturamento < 500000\n) {\n  riscoScore += 10;\n  motivos.push('Faturamento estimado baixo para priorização comercial.');\n} else {\n  pontosPositivos.push(`Faturamento estimado encontrado: ${empresa.faixa_faturamento_grupo || faturamento}.`);\n}\n\nif (!faixaFuncionarios) {\n  riscoScore += 5;\n  motivos.push('Faixa de funcionários não encontrada.');\n} else {\n  pontosPositivos.push(`Faixa de funcionários encontrada: ${empresa.faixa_funcionarios_grupo}.`);\n}\n\n// =========================\n// DÍVIDAS\n// =========================\n\nif (totalDivida > 0) {\n  if (totalDivida >= 1000000) {\n    riscoScore += 30;\n    motivos.push(`Dívida ativa alta encontrada: R$ ${totalDivida.toLocaleString('pt-BR')}.`);\n  } else if (totalDivida >= 100000) {\n    riscoScore += 20;\n    motivos.push(`Dívida ativa relevante encontrada: R$ ${totalDivida.toLocaleString('pt-BR')}.`);\n  } else {\n    riscoScore += 10;\n    motivos.push(`Dívida ativa encontrada: R$ ${totalDivida.toLocaleString('pt-BR')}.`);\n  }\n} else {\n  pontosPositivos.push('Nenhuma dívida ativa relevante encontrada no retorno da consulta.');\n}\n\n// =========================\n// PRESENÇA ONLINE\n// =========================\n\nconst site = sites[0]?.site || '';\nconst linkedin = empresa.linkedin_url || '';\n\nif (!site) {\n  riscoScore += 7;\n  motivos.push('Site não encontrado.');\n} else {\n  pontosPositivos.push(`Site encontrado: ${site}.`);\n}\n\nif (!linkedin) {\n  riscoScore += 7;\n  motivos.push('LinkedIn da empresa não encontrado.');\n} else {\n  pontosPositivos.push(`LinkedIn encontrado: ${linkedin}.`);\n}\n\nif (!telefones.length) {\n  riscoScore += 5;\n  motivos.push('Telefone comercial não encontrado.');\n} else {\n  pontosPositivos.push('Telefone comercial encontrado.');\n}\n\n// =========================\n// SÓCIOS\n// =========================\n\nif (!socios.length) {\n  riscoScore += 5;\n  motivos.push('Sócios não encontrados no retorno.');\n} else {\n  pontosPositivos.push(`${socios.length} sócio(s) encontrado(s).`);\n}\n\n// =========================\n// IDADE DA EMPRESA\n// =========================\n\nif (empresa.data_inicio_atividade) {\n  const inicio = new Date(empresa.data_inicio_atividade);\n  const hoje = new Date();\n  const idadeAnos = (hoje - inicio) / (1000 * 60 * 60 * 24 * 365.25);\n\n  if (idadeAnos < 1) {\n    riscoScore += 15;\n    motivos.push('Empresa com menos de 1 ano de atividade.');\n  } else if (idadeAnos < 2) {\n    riscoScore += 7;\n    motivos.push('Empresa com menos de 2 anos de atividade.');\n  } else {\n    pontosPositivos.push(`Empresa com aproximadamente ${Math.floor(idadeAnos)} anos de atividade.`);\n  }\n}\n\n// =========================\n// CLASSIFICAÇÃO FINAL\n// =========================\n\nriscoScore = Math.min(riscoScore, 100);\n\nlet riscoNivel = 'Baixo';\nlet recomendacao = 'Pode seguir para abordagem comercial normalmente.';\n\nif (riscoScore >= 70) {\n  riscoNivel = 'Alto';\n  recomendacao = 'Recomenda-se validação manual antes de avançar comercialmente.';\n} else if (riscoScore >= 35) {\n  riscoNivel = 'Médio';\n  recomendacao = 'Pode avançar, mas com atenção aos pontos de risco identificados.';\n}\n\nconst sociosResumo = socios\n  .map(s => `${s.nome_socio || ''} (${s.qualificacao_socio || 'sócio'})`)\n  .filter(Boolean)\n  .join(', ');\n\nconst notaRisco = `ANÁLISE DE RISCO COMERCIAL / COMPLIANCE\n\nEmpresa: ${empresa.nome_fantasia || empresa.razao_social || ''}\nRazão social: ${empresa.razao_social || ''}\nCNPJ: ${empresa.cnpj || ''}\nSituação cadastral: ${empresa.situacao_cadastral || ''}\nPorte: ${empresa.porte || ''}\nSegmento: ${empresa.segmento || ''}\nCNAE principal: ${empresa.cnae_principal_desc_classe || ''}\nCidade/UF: ${empresa.municipio || ''} - ${empresa.uf || ''}\nFaturamento estimado: ${empresa.faixa_faturamento_grupo || ''}\nFuncionários: ${empresa.faixa_funcionarios_grupo || ''}\nSite: ${site}\nLinkedIn: ${linkedin}\nSócios: ${sociosResumo}\n\nRISCO FINAL: ${riscoNivel}\nScore de risco: ${riscoScore}/100\n\nMotivos de atenção:\n${motivos.length ? motivos.map(m => `- ${m}`).join('\\n') : '- Nenhum ponto crítico encontrado.'}\n\nPontos positivos:\n${pontosPositivos.length ? pontosPositivos.map(p => `- ${p}`).join('\\n') : '- Nenhum ponto positivo relevante encontrado.'}\n\nRecomendação:\n${recomendacao}`;\n\nreturn [\n  {\n    json: {\n      email: lead.email || '',\n      domain: lead.domain || '',\n      nome_lead: lead.nome_lead || '',\n      org_id: lead.org_id || '',\n      person_id: lead.person_id || '',\n      deal_id: lead.deal_id || '',\n\n      cnpj: empresa.cnpj ? String(empresa.cnpj) : '',\n      razao_social: empresa.razao_social || '',\n      nome_fantasia: empresa.nome_fantasia || empresa.razao_social || '',\n      situacao_cadastral: empresa.situacao_cadastral || '',\n      porte: empresa.porte || '',\n      segmento: empresa.segmento || '',\n      cnae_principal: empresa.cnae_principal_desc_classe || '',\n      municipio: empresa.municipio || '',\n      uf: empresa.uf || '',\n      faixa_faturamento: empresa.faixa_faturamento_grupo || '',\n      faixa_funcionarios: empresa.faixa_funcionarios_grupo || '',\n      website: site,\n      linkedin_url: linkedin,\n      telefone: telefones[0]?.telefone_completo || '',\n      socios: JSON.stringify(socios),\n\n      total_divida: totalDivida,\n      risco_comercial: riscoNivel,\n      risco_score: riscoScore,\n      risco_motivos: motivos,\n      risco_pontos_positivos: pontosPositivos,\n      recomendacao_comercial: recomendacao,\n      nota_risco_compliance: notaRisco,\n\n      kipflow_success: enrichment.success || false,\n      kipflow_cost: enrichment.cost || enrichment.pricing?.adjustedCost || '',\n      kipflow_cost_formatted: enrichment.costFormatted || enrichment.pricing?.adjustedCostFormatted || ''\n    }\n  }\n];"
},
"id": "7e73130f-0064-4bb9-bd5e-aed9cb323caf",
"name": "Code — Calcular Risco Comercial",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
1136,
1152
]
},
{
"parameters": {
"jsCode": "const lead = $input.first().json;\n\nconst notaRisco = `ANÁLISE NÃO EXECUTADA\n\nMotivo: o domínio informado parece ser de e-mail pessoal/gratuito.\n\nEntrada recebida: ${lead.email || lead.domain}\nDomínio extraído: ${lead.domain}\n\nRecomendação:\nSolicitar e-mail corporativo, domínio da empresa, CNPJ ou nome da empresa para buscar por outro método.`;\n\nreturn [\n  {\n    json: {\n      ...lead,\n      risco_comercial: 'Indeterminado',\n      risco_score: null,\n      recomendacao_comercial: 'Solicitar dados corporativos antes de qualificar o lead.',\n      nota_risco_compliance: notaRisco\n    }\n  }\n];"
},
"id": "440809f3-ae01-4b8c-b47e-4d3478a561f3",
"name": "Code — Domínio Pessoal",
"type": "n8n-nodes-base.code",
"typeVersion": 2,
"position": [
848,
1376
]
},
{
"parameters": {
"content": "## Risco Comercial\n\n",
"height": 384,
"width": 1520
},
"type": "n8n-nodes-base.stickyNote",
"position": [
-128,
1136
],
"typeVersion": 1,
"id": "acb8c5b0-9d4b-4440-bcb7-d1eae5691895",
"name": "Sticky Note5",
"disabled": true
}
],
"pinData": {
"Webhook — Lead Inbound1": [
{
"json": {
"headers": {
"host": "exportelas-n8n-editor.f0dgeg.easypanel.host",
"user-agent": "Pipedrive Webhooks",
"content-length": "1039",
"accept": "application/json, text/plain, */*",
"accept-encoding": "gzip, compress, deflate, br",
"content-type": "application/json",
"x-forwarded-for": "44.228.233.78",
"x-forwarded-host": "exportelas-n8n-editor.f0dgeg.easypanel.host",
"x-forwarded-port": "443",
"x-forwarded-proto": "https",
"x-forwarded-server": "48d059c6a5c7",
"x-real-ip": "44.228.233.78"
},
"params": {},
"query": {},
"body": {
"data": {
"add_time": "2026-05-27T06:54:41Z",
"channel": 7,
"channel_id": null,
"close_time": null,
"creator_user_id": 26510409,
"currency": "BRL",
"custom_fields": {},
"expected_close_date": null,
"first_won_time": null,
"id": 178,
"label_ids": [],
"lost_reason": null,
"lost_time": null,
"org_id": 130,
"origin": "ManuallyCreated",
"origin_id": null,
"owner_id": 26510409,
"person_id": 179,
"pipeline_id": 3,
"probability": null,
"stage_change_time": null,
"stage_id": 12,
"status": "open",
"title": "KIPFFLOW",
"update_time": null,
"value": 0,
"visible_to": "3",
"won_time": null,
"is_archived": false,
"archive_time": null
},
"previous": null,
"meta": {
"action": "create",
"company_id": "15747575",
"correlation_id": "ac082c9f-fb53-47e5-a1a6-227c2fccd657",
"entity_id": "178",
"entity": "deal",
"id": "8818e477-972e-4ddb-8d8e-cb61a933db4e",
"is_bulk_edit": false,
"timestamp": "2026-05-27T06:54:41.426Z",
"type": "general",
"user_id": "26510409",
"version": "2.0",
"webhook_id": "1872755",
"webhook_owner_id": "26510409",
"change_source": "app",
"permitted_user_ids": [
"26510409"
],
"attempt": 1,
"host": "playbooklab.pipedrive.com"
}
},
"webhookUrl": "https://exportelas-n8n-webhook.f0dgeg.easypanel.host/webhook-test/fluxo4-lead-inbound",
"executionMode": "test"
}
}
],
"Form — Buscar Pessoa": [
{
"json": {
"LinkedIn Public ID ou URL": "victorzbaggio",
"Pipedrive Person ID": "",
"submittedAt": "2026-05-27T09:35:36.926-03:00",
"formMode": "test"
}
}
],
"Form — Buscar Pessoa1": [
{
"json": {
"LinkedIn Public ID ou URL": "Playbooklab",
"Pipedrive Person ID": "",
"submittedAt": "2026-05-27T21:26:55.094-03:00",
"formMode": "test"
},
"pairedItem": {
"item": 0
}
}
],
"Form — Buscar Decisores1": [
{
"json": {
"LinkedIn Company Public ID ou URL": "magazine-luiza",
"Senioridade": "C-SUITE / DIRETOR",
"Área": "",
"Quantidade de contatos": "5",
"Priorizar decisores?": "",
"Pipedrive Org ID": "",
"submittedAt": "2026-05-27T22:00:42.184-03:00",
"formMode": "test"
},
"pairedItem": {
"item": 0
}
}
],
"Enrichment — Empresa por Domínio": [
{
"json": {
"success": true,
"data": {
"atividades_secundarias": [
{
"classe": 62023,
"desc_classe": "62023 - DESENVOLVIMENTO E LICENCIAMENTO DE PROGRAMAS DE COMPUTADOR CUSTOMIZAVEIS",
"desc_divisao": "62 - ATIVIDADES DOS SERVICOS DE TECNOLOGIA DA INFORMACAO",
"desc_grupo": "620 - ATIVIDADES DOS SERVICOS DE TECNOLOGIA DA INFORMACAO",
"desc_secao": "J - INFORMACAO E COMUNICACAO",
"desc_subclasse": "6202300 - DESENVOLVIMENTO E LICENCIAMENTO DE PROGRAMAS DE COMPUTADOR CUSTOMIZAVEIS",
"divisao": 62,
"grupo": 620,
"ramo_de_atividade": "OUTROS SERVICOS",
"secao": "J",
"segmento": "SERVICOS",
"subclasse": 6202300
},
{
"classe": 73190,
"desc_classe": "73190 - ATIVIDADES DE PUBLICIDADE NAO ESPECIFICADAS ANTERIORMENTE",
"desc_divisao": "73 - PUBLICIDADE E PESQUISA DE MERCADO",
"desc_grupo": "731 - PUBLICIDADE",
"desc_secao": "M - ATIVIDADES PROFISSIONAIS, CIENTIFICAS E TECNICAS",
"desc_subclasse": "7319003 - MARKETING DIRETO",
"divisao": 73,
"grupo": 731,
"ramo_de_atividade": "OUTROS SERVICOS",
"secao": "M",
"segmento": "SERVICOS",
"subclasse": 7319003
},
{
"classe": 62031,
"desc_classe": "62031 - DESENVOLVIMENTO E LICENCIAMENTO DE PROGRAMAS DE COMPUTADOR NAO CUSTOMIZAVEIS",
"desc_divisao": "62 - ATIVIDADES DOS SERVICOS DE TECNOLOGIA DA INFORMACAO",
"desc_grupo": "620 - ATIVIDADES DOS SERVICOS DE TECNOLOGIA DA INFORMACAO",
"desc_secao": "J - INFORMACAO E COMUNICACAO",
"desc_subclasse": "6203100 - DESENVOLVIMENTO E LICENCIAMENTO DE PROGRAMAS DE COMPUTADOR NAO CUSTOMIZAVEIS",
"divisao": 62,
"grupo": 620,
"ramo_de_atividade": "OUTROS SERVICOS",
"secao": "J",
"segmento": "SERVICOS",
"subclasse": 6203100
},
{
"classe": 82113,
"desc_classe": "82113 - SERVICOS COMBINADOS DE ESCRITORIO E APOIO ADMINISTRATIVO",
"desc_divisao": "82 - SERVICOS DE ESCRITORIO, DE APOIO ADMINISTRATIVO E OUTROS SERVICOS PRESTADOS PRINCIPALMENTE AS EMPRESAS",
"desc_grupo": "821 - SERVICOS DE ESCRITORIO E APOIO ADMINISTRATIVO",
"desc_secao": "N - ATIVIDADES ADMINISTRATIVAS E SERVICOS COMPLEMENTARES",
"desc_subclasse": "8211300 - SERVICOS COMBINADOS DE ESCRITORIO E APOIO ADMINISTRATIVO",
"divisao": 82,
"grupo": 821,
"ramo_de_atividade": "SERVICOS ADMINISTRATIVOS",
"secao": "N",
"segmento": "SERVICOS",
"subclasse": 8211300
},
{
"classe": 85996,
"desc_classe": "85996 - ATIVIDADES DE ENSINO NAO ESPECIFICADAS ANTERIORMENTE",
"desc_divisao": "85 - EDUCACAO",
"desc_grupo": "859 - OUTRAS ATIVIDADES DE ENSINO",
"desc_secao": "P - EDUCACAO",
"desc_subclasse": "8599604 - TREINAMENTO EM DESENVOLVIMENTO PROFISSIONAL E GERENCIAL",
"divisao": 85,
"grupo": 859,
"ramo_de_atividade": "SERVICOS DE EDUCACAO",
"secao": "P",
"segmento": "SERVICOS",
"subclasse": 8599604
}
],
"bairro": "CABRAL",
"capital_social": 5000,
"cep": 80035210,
"cnae_principal_classe": 73190,
"cnae_principal_desc_classe": "73190 - ATIVIDADES DE PUBLICIDADE NAO ESPECIFICADAS ANTERIORMENTE",
"cnae_principal_desc_divisao": "73 - PUBLICIDADE E PESQUISA DE MERCADO",
"cnae_principal_desc_grupo": "731 - PUBLICIDADE",
"cnae_principal_desc_secao": "M - ATIVIDADES PROFISSIONAIS, CIENTIFICAS E TECNICAS",
"cnae_principal_desc_subclasse": "7319002 - PROMOCAO DE VENDAS",
"cnae_principal_subclasse": 7319002,
"cnpj": 44381718000140,
"data_inicio_atividade": "2021-11-25",
"dv_cnpj": 40,
"empresa_publico_privada": "PRIVADA",
"endereco": "RUA VEREADOR ANTONIO DOS REIS CAVALHEIRO 103 - CABRAL - APT 201 ANDAR 02 BLOCO MARIA CONCEICAO LUST - 80035210",
"faixa_faturamento_grupo": "360K A 1M",
"faixa_funcionarios_grupo": "06 A 09",
"faturamento": 670313,
"faturamento_grupo": 670313,
"forma_de_tributacao_ajustada": "SIMPLES NAO MEI",
"forma_de_tributacao_modelada": "SIMPLES",
"lat": -25.403937499999998,
"linkedin_url": "linkedin.com/company/playbooklab",
"lon": -49.248187500000014,
"macrorregiao": "SUL",
"matriz": true,
"mesorregiao": "METROPOLITANA DE CURITIBA",
"microrregiao": "CURITIBA",
"municipio": "CURITIBA",
"natureza_juridica": "SOCIEDADE EMPRESARIA LIMITADA",
"nivel_de_atividade": "BAIXA",
"nome_fantasia": "FTX INSIDE SALES VENDAS DIGITAIS",
"opcao_pelo_mei": false,
"opcao_pelo_simples": true,
"perfil_socioeconomico_bairro_desc": "ALTISSIMO",
"porte": "MICRO EMPRESA",
"qtde_filiais": 0,
"raiz_cnpj": 44381718,
"razao_social": "FTX INSIDE SALES VENDAS DIGITAIS LTDA.",
"segmento": "SERVICOS",
"sites": [
{
"confiabilidade": 0.4099,
"ecommerce": false,
"pertence_contador": false,
"site": "playbooklab.com.br"
}
],
"situacao_cadastral": "ATIVA",
"socios": [
{
"cnpj_cpf_socio": "***426939**",
"contatos_id": "337078406",
"cpf": "08642693908",
"data_entrada_sociedade": "2025-06-26",
"data_nascimento": "2000-03-11",
"faixa_etaria_socio": "21 A 30 ANOS",
"identificador_socio": "PESSOA FISICA",
"nome_com_cnpj_cpf": "ARTHUR ZAWADZKI BAGGIO | ***426939**",
"nome_socio": "ARTHUR ZAWADZKI BAGGIO",
"qualificacao_representante_legal": "NAO INFORMADA",
"qualificacao_socio": "SOCIO-ADMINISTRADOR",
"sexo": "M"
},
{
"cnpj_cpf_socio": "***122099**",
"contatos_id": "318289520",
"cpf": "06912209998",
"data_entrada_sociedade": "2021-11-25",
"data_nascimento": "1995-02-14",
"faixa_etaria_socio": "31 A 40 ANOS",
"identificador_socio": "PESSOA FISICA",
"nome_com_cnpj_cpf": "FERNANDO SANTOS TEDESCO | ***122099**",
"nome_socio": "FERNANDO SANTOS TEDESCO",
"qualificacao_representante_legal": "NAO INFORMADA",
"qualificacao_socio": "SOCIO-ADMINISTRADOR",
"sexo": "M"
},
{
"cnpj_cpf_socio": "***426929**",
"contatos_id": "337720983",
"cpf": "08642692936",
"data_entrada_sociedade": "2023-04-25",
"data_nascimento": "1996-05-30",
"faixa_etaria_socio": "21 A 30 ANOS",
"identificador_socio": "PESSOA FISICA",
"nome_com_cnpj_cpf": "VICTOR ZAWADZKI BAGGIO | ***426929**",
"nome_socio": "VICTOR ZAWADZKI BAGGIO",
"qualificacao_representante_legal": "NAO INFORMADA",
"qualificacao_socio": "SOCIO-ADMINISTRADOR",
"sexo": "M"
}
],
"uf": "PARANA"
},
"datasets": [
"basic",
"complete",
"address",
"online_presence",
"partners",
"debts"
],
"pricing": {
"baseCost": 0.88,
"baseCostFormatted": "R$ 0.88",
"adjustedCost": 0.88,
"adjustedCostFormatted": "R$ 0.88",
"discount": "0.00%",
"tier": {
"min": 1,
"max": 1000,
"multiplier": 1
},
"monthlyUsage": 39,
"endpointKey": "companies"
},
"cost": 0.88,
"costFormatted": "R$ 0.88"
},
"pairedItem": {
"item": 0
}
}
],
"GenerateEmails contacts": [
{
"json": {
"success": true,
"data": [
{
"full_name": "ARTHUR BAGGIO",
"email": "arthur.baggio@playbooklab.com.br",
"validation": "risky",
"seniority": "C-SUITE / DIRETOR",
"area": "INOVACAO"
},
{
"full_name": "FERNANDO TEDESCO",
"email": "fernando.tedesco@playbooklab.com.br",
"validation": "risky",
"seniority": "C-SUITE / DIRETOR",
"area": "N/A"
},
{
"full_name": "VICTOR BAGGIO",
"email": "victor.baggio@playbooklab.com.br",
"validation": "risky",
"seniority": "C-SUITE / DIRETOR",
"area": "SOCIO"
},
{
"full_name": "BRUNNO FERREIRA",
"email": "brunno.ferreira@playbooklab.com.br",
"validation": "risky",
"seniority": "ESPECIALISTA",
"area": "N/A"
},
{
"full_name": "NATANAEL ISIDORO",
"email": "natanael.isidoro@playbooklab.com.br",
"validation": "risky",
"seniority": "OUTROS",
"area": "ENGENHARIA"
},
{
"full_name": "MATEUS JUNG",
"email": "mateus.jung@playbooklab.com.br",
"validation": "risky",
"seniority": "OUTROS",
"area": "INOVACAO"
},
{
"full_name": "ARTHUR BAGGIO",
"email": "arthur.baggio@playbooklab.com.br",
"validation": "risky",
"seniority": "OUTROS",
"area": "INOVACAO"
}
],
"datasets": [
"default"
],
"pricing": {
"baseCost": 0.91,
"baseCostFormatted": "R$ 0.91",
"adjustedCost": 0.91,
"adjustedCostFormatted": "R$ 0.91",
"discount": "0.00%",
"tier": {
"min": 1,
"max": 1000,
"multiplier": 1
},
"monthlyUsage": 192,
"endpointKey": "contacts-emails"
},
"cost": 0.91,
"costFormatted": "R$ 0.91"
}
}
],
"Form — Risco Comercial": [
{
"json": {
"Email ou domínio": "corporativo@magazineluiza.com.br",
"Nome do lead": "",
"Pipedrive Org ID": "",
"Pipedrive Person ID": "",
"Pipedrive Deal ID": "",
"submittedAt": "2026-05-28T07:13:55.001-03:00",
"formMode": "test"
},
"pairedItem": {
"item": 0
}
}
]
},
"connections": {
"Form — Buscar Pessoa1": {
"main": [
[
{
"node": "Buscar Perfil LinkedIn Empresa",
"type": "main",
"index": 0
}
]
]
},
"Gerar Telefone da Pessoa": {
"main": [
[
{
"node": "Consolidar Dados1",
"type": "main",
"index": 0
}
]
]
},
"Gerar Email da Pessoa1": {
"main": [
[
{
"node": "Consolidar Dados1",
"type": "main",
"index": 0
}
]
]
},
"Consolidar Dados1": {
"main": [
[]
]
},
"Webhook — Lead Inbound1": {
"main": [
[
{
"node": "Extrair IDs do Evento1",
"type": "main",
"index": 0
}
]
]
},
"Extrair IDs do Evento1": {
"main": [
[
{
"node": "Buscar Pessoa no Pipedrive1",
"type": "main",
"index": 0
}
]
]
},
"Buscar Pessoa no Pipedrive1": {
"main": [
[
{
"node": "Extrair Domínio do Email1",
"type": "main",
"index": 0
}
]
]
},
"Extrair Domínio do Email1": {
"main": [
[
{
"node": "Enrichment — Empresa por Domínio",
"type": "main",
"index": 0
}
]
]
},
"Form — Buscar Pessoa": {
"main": [
[
{
"node": "Gerar email de uma pessoa a partir do LinkedIn ID",
"type": "main",
"index": 0
}
]
]
},
"Buscar Perfil LinkedIn Empresa": {
"main": [
[
{
"node": "Gerar Telefone da Pessoa",
"type": "main",
"index": 0
},
{
"node": "Gerar Email da Pessoa1",
"type": "main",
"index": 0
}
]
]
},
"Kipflow — Buscar Pessoas LinkedIn": {
"main": [
[
{
"node": "Code — Extrair Pessoas",
"type": "main",
"index": 0
}
]
]
},
"Code — Extrair Pessoas": {
"main": [
[
{
"node": "Kipflow — Gerar Email do Decisor",
"type": "main",
"index": 0
}
]
]
},
"Kipflow — Gerar Email do Decisor": {
"main": [
[
{
"node": "Code — Consolidar Decisor",
"type": "main",
"index": 0
}
]
]
},
"Form — Buscar Decisores1": {
"main": [
[
{
"node": "Kipflow — Buscar Pessoas LinkedIn",
"type": "main",
"index": 0
}
]
]
},
"Enrichment — Empresa por Domínio": {
"main": [
[
{
"node": "Extrair Dados da Empresa",
"type": "main",
"index": 0
}
]
]
},
"Extrair Dados da Empresa": {
"main": [
[
{
"node": "GenerateEmails contacts",
"type": "main",
"index": 0
}
]
]
},
"GenerateEmails contacts": {
"main": [
[
{
"node": "Formatar Lista",
"type": "main",
"index": 0
}
]
]
},
"Formatar Lista": {
"main": [
[
{
"node": "Update an organization2",
"type": "main",
"index": 0
}
]
]
},
"Form — Criar Lista de Empresas": {
"main": [
[
{
"node": "Kipflow — Buscar Empresas com Filtros",
"type": "main",
"index": 0
}
]
]
},
"Kipflow — Buscar Empresas com Filtros": {
"main": [
[
{
"node": "Code — Formatar Lista de Empresas",
"type": "main",
"index": 0
}
]
]
},
"Code — Formatar Lista de Empresas": {
"main": [
[
{
"node": "Split Out — Empresas",
"type": "main",
"index": 0
}
]
]
},
"Form — Risco Comercial": {
"main": [
[
{
"node": "Code — Extrair Domínio",
"type": "main",
"index": 0
}
]
]
},
"Code — Extrair Domínio": {
"main": [
[
{
"node": "IF — Domínio Corporativo?",
"type": "main",
"index": 0
}
]
]
},
"IF — Domínio Corporativo?": {
"main": [
[
{
"node": "Kipflow — Enriquecer Empresa para Risco",
"type": "main",
"index": 0
}
],
[
{
"node": "Code — Domínio Pessoal",
"type": "main",
"index": 0
}
]
]
},
"Kipflow — Enriquecer Empresa para Risco": {
"main": [
[
{
"node": "Code — Calcular Risco Comercial",
"type": "main",
"index": 0
}
]
]
}
},
"active": true,
"settings": {
"executionOrder": "v1",
"binaryMode": "separate",
"availableInMCP": true
},
"versionId": "f4801c95-3059-4ad2-a58f-ba3d932e0943",
"meta": {
"aiBuilderAssisted": true,
"builderVariant": "mcp",
"templateCredsSetupCompleted": true,
"instanceId": "281e75b8d6e19c1eeb26c39d3f2b999bf4ba997a798aad286abfc1e0c449890d"
},
"id": "6E5hJy25Ccjb6pq9",
"tags": []
}