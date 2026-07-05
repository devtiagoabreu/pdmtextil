-- Estados brasileiros
INSERT INTO crm_estados (nome, uf) VALUES
  ('Acre', 'AC'),
  ('Alagoas', 'AL'),
  ('Amapá', 'AP'),
  ('Amazonas', 'AM'),
  ('Bahia', 'BA'),
  ('Ceará', 'CE'),
  ('Distrito Federal', 'DF'),
  ('Espírito Santo', 'ES'),
  ('Goiás', 'GO'),
  ('Maranhão', 'MA'),
  ('Mato Grosso', 'MT'),
  ('Mato Grosso do Sul', 'MS'),
  ('Minas Gerais', 'MG'),
  ('Pará', 'PA'),
  ('Paraíba', 'PB'),
  ('Paraná', 'PR'),
  ('Pernambuco', 'PE'),
  ('Piauí', 'PI'),
  ('Rio de Janeiro', 'RJ'),
  ('Rio Grande do Norte', 'RN'),
  ('Rio Grande do Sul', 'RS'),
  ('Rondônia', 'RO'),
  ('Roraima', 'RR'),
  ('Santa Catarina', 'SC'),
  ('São Paulo', 'SP'),
  ('Sergipe', 'SE'),
  ('Tocantins', 'TO')
ON CONFLICT (nome) DO NOTHING;

-- Cidades brasileiras (principais por estado)
-- AC
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Rio Branco', id FROM crm_estados WHERE uf='AC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Cruzeiro do Sul', id FROM crm_estados WHERE uf='AC' ON CONFLICT DO NOTHING;
-- AL
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Maceió', id FROM crm_estados WHERE uf='AL' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Arapiraca', id FROM crm_estados WHERE uf='AL' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Palmeira dos Índios', id FROM crm_estados WHERE uf='AL' ON CONFLICT DO NOTHING;
-- AP
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Macapá', id FROM crm_estados WHERE uf='AP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santana', id FROM crm_estados WHERE uf='AP' ON CONFLICT DO NOTHING;
-- AM
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Manaus', id FROM crm_estados WHERE uf='AM' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Parintins', id FROM crm_estados WHERE uf='AM' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Itacoatiara', id FROM crm_estados WHERE uf='AM' ON CONFLICT DO NOTHING;
-- BA
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Salvador', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Feira de Santana', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Vitória da Conquista', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ilhéus', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Itabuna', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Barreiras', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Lauro de Freitas', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Camaçari', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Juazeiro', id FROM crm_estados WHERE uf='BA' ON CONFLICT DO NOTHING;
-- CE
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Fortaleza', id FROM crm_estados WHERE uf='CE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Caucaia', id FROM crm_estados WHERE uf='CE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Juazeiro do Norte', id FROM crm_estados WHERE uf='CE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Maracanaú', id FROM crm_estados WHERE uf='CE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Sobral', id FROM crm_estados WHERE uf='CE' ON CONFLICT DO NOTHING;
-- DF
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Brasília', id FROM crm_estados WHERE uf='DF' ON CONFLICT DO NOTHING;
-- ES
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Vitória', id FROM crm_estados WHERE uf='ES' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Vila Velha', id FROM crm_estados WHERE uf='ES' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Serra', id FROM crm_estados WHERE uf='ES' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Cariacica', id FROM crm_estados WHERE uf='ES' ON CONFLICT DO NOTHING;
-- GO
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Goiânia', id FROM crm_estados WHERE uf='GO' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Aparecida de Goiânia', id FROM crm_estados WHERE uf='GO' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Anápolis', id FROM crm_estados WHERE uf='GO' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Rio Verde', id FROM crm_estados WHERE uf='GO' ON CONFLICT DO NOTHING;
-- MA
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Luís', id FROM crm_estados WHERE uf='MA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Imperatriz', id FROM crm_estados WHERE uf='MA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Timon', id FROM crm_estados WHERE uf='MA' ON CONFLICT DO NOTHING;
-- MT
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Cuiabá', id FROM crm_estados WHERE uf='MT' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Várzea Grande', id FROM crm_estados WHERE uf='MT' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Rondonópolis', id FROM crm_estados WHERE uf='MT' ON CONFLICT DO NOTHING;
-- MS
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Campo Grande', id FROM crm_estados WHERE uf='MS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Dourados', id FROM crm_estados WHERE uf='MS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Três Lagoas', id FROM crm_estados WHERE uf='MS' ON CONFLICT DO NOTHING;
-- MG
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Belo Horizonte', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Uberlândia', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Contagem', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Juiz de Fora', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Betim', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Montes Claros', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Uberaba', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Governador Valadares', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ipatinga', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Divinópolis', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Poços de Caldas', id FROM crm_estados WHERE uf='MG' ON CONFLICT DO NOTHING;
-- PA
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Belém', id FROM crm_estados WHERE uf='PA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ananindeua', id FROM crm_estados WHERE uf='PA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santarém', id FROM crm_estados WHERE uf='PA' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Marabá', id FROM crm_estados WHERE uf='PA' ON CONFLICT DO NOTHING;
-- PB
INSERT INTO crm_cidades (nome, estado_id) SELECT 'João Pessoa', id FROM crm_estados WHERE uf='PB' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Campina Grande', id FROM crm_estados WHERE uf='PB' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santa Rita', id FROM crm_estados WHERE uf='PB' ON CONFLICT DO NOTHING;
-- PR
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Curitiba', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Londrina', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Maringá', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ponta Grossa', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Cascavel', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São José dos Pinhais', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Foz do Iguaçu', id FROM crm_estados WHERE uf='PR' ON CONFLICT DO NOTHING;
-- PE
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Recife', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Jaboatão dos Guararapes', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Olinda', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Caruaru', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Petrolina', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Paulista', id FROM crm_estados WHERE uf='PE' ON CONFLICT DO NOTHING;
-- PI
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Teresina', id FROM crm_estados WHERE uf='PI' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Parnaíba', id FROM crm_estados WHERE uf='PI' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Picos', id FROM crm_estados WHERE uf='PI' ON CONFLICT DO NOTHING;
-- RJ
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Rio de Janeiro', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Niterói', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Duque de Caxias', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Nova Iguaçu', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Campos dos Goytacazes', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Petrópolis', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Gonçalo', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Volta Redonda', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Macaé', id FROM crm_estados WHERE uf='RJ' ON CONFLICT DO NOTHING;
-- RN
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Natal', id FROM crm_estados WHERE uf='RN' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Mossoró', id FROM crm_estados WHERE uf='RN' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Parnamirim', id FROM crm_estados WHERE uf='RN' ON CONFLICT DO NOTHING;
-- RS
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Porto Alegre', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Caxias do Sul', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Pelotas', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Canoas', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santa Maria', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Novo Hamburgo', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Leopoldo', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Passo Fundo', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Bento Gonçalves', id FROM crm_estados WHERE uf='RS' ON CONFLICT DO NOTHING;
-- RO
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Porto Velho', id FROM crm_estados WHERE uf='RO' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ji-Paraná', id FROM crm_estados WHERE uf='RO' ON CONFLICT DO NOTHING;
-- RR
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Boa Vista', id FROM crm_estados WHERE uf='RR' ON CONFLICT DO NOTHING;
-- SC
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Florianópolis', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Joinville', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Blumenau', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São José', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Chapecó', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Criciúma', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Itajaí', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Lages', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Brusque', id FROM crm_estados WHERE uf='SC' ON CONFLICT DO NOTHING;
-- SP
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Paulo', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Guarulhos', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Campinas', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Bernardo do Campo', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santo André', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Osasco', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Sorocaba', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Ribeirão Preto', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São José dos Campos', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Santos', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Mauá', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São José do Rio Preto', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Jundiaí', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Piracicaba', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Americana', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Bauru', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'São Caetano do Sul', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Praia Grande', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Taboão da Serra', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Diadema', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Franca', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Suzano', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Sumaré', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Barueri', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Embu das Artes', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Itaquaquecetuba', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Carapicuíba', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Taubaté', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Presidente Prudente', id FROM crm_estados WHERE uf='SP' ON CONFLICT DO NOTHING;
-- SE
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Aracaju', id FROM crm_estados WHERE uf='SE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Nossa Senhora do Socorro', id FROM crm_estados WHERE uf='SE' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Lagarto', id FROM crm_estados WHERE uf='SE' ON CONFLICT DO NOTHING;
-- TO
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Palmas', id FROM crm_estados WHERE uf='TO' ON CONFLICT DO NOTHING;
INSERT INTO crm_cidades (nome, estado_id) SELECT 'Araguaína', id FROM crm_estados WHERE uf='TO' ON CONFLICT DO NOTHING;
