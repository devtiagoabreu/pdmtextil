"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
var server_1 = require("next/server");
var db_1 = require("@/lib/db");
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var crm_leads_1 = require("@/lib/db/schema/crm-leads");
var crmWhatsappConversas = (0, pg_core_1.pgTable)("crm_whatsapp_conversas", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    remoteJid: (0, pg_core_1.varchar)("remote_jid", { length: 255 }).notNull().unique(),
    estado: (0, pg_core_1.varchar)("estado", { length: 50 }).notNull().default("SAUDACAO"),
    dados: (0, pg_core_1.jsonb)("dados").$type().default({}),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
function extrairNumero(remoteJid) {
    return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "");
}
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var remoteJid, conversa, nova, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    remoteJid = req.nextUrl.searchParams.get("remoteJid");
                    if (!remoteJid) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "remoteJid obrigatório" }, { status: 400 })];
                    }
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(crmWhatsappConversas)
                            .where((0, drizzle_orm_1.eq)(crmWhatsappConversas.remoteJid, remoteJid))
                            .limit(1)
                            .then(function (r) { return r[0] || null; })];
                case 1:
                    conversa = _a.sent();
                    if (!!conversa) return [3 /*break*/, 3];
                    return [4 /*yield*/, db_1.db
                            .insert(crmWhatsappConversas)
                            .values({ remoteJid: remoteJid, estado: "SAUDACAO", dados: {} })
                            .returning()];
                case 2:
                    nova = (_a.sent())[0];
                    conversa = __assign(__assign({}, nova), { isNew: true });
                    return [3 /*break*/, 4];
                case 3:
                    conversa = __assign(__assign({}, conversa), { isNew: false });
                    _a.label = 4;
                case 4: return [2 /*return*/, server_1.NextResponse.json(conversa)];
                case 5:
                    error_1 = _a.sent();
                    console.error("[GET /api/crm/whatsapp/conversa]", error_1);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Erro interno" }, { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, remoteJid, estado, dados, atualizada, lead, existing, numero, descricaoParts, novo, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, req.json()];
                case 1:
                    _a = _b.sent(), remoteJid = _a.remoteJid, estado = _a.estado, dados = _a.dados;
                    if (!remoteJid) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "remoteJid obrigatório" }, { status: 400 })];
                    }
                    return [4 /*yield*/, db_1.db
                            .insert(crmWhatsappConversas)
                            .values({ remoteJid: remoteJid, estado: estado || "SAUDACAO", dados: dados || {} })
                            .onConflictDoUpdate({
                            target: crmWhatsappConversas.remoteJid,
                            set: { estado: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["EXCLUDED.estado"], ["EXCLUDED.estado"]))), dados: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["EXCLUDED.dados"], ["EXCLUDED.dados"]))), updatedAt: (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["NOW()"], ["NOW()"]))) },
                        })
                            .returning()];
                case 2:
                    atualizada = (_b.sent())[0];
                    lead = null;
                    if (!((estado === "FINALIZANDO" || estado === "ENCERRADO") && (dados === null || dados === void 0 ? void 0 : dados.nome))) return [3 /*break*/, 5];
                    return [4 /*yield*/, db_1.db
                            .select({ id: crm_leads_1.crmLeads.id })
                            .from(crm_leads_1.crmLeads)
                            .where((0, drizzle_orm_1.eq)(crm_leads_1.crmLeads.idIntegracao, "whatsapp:".concat(remoteJid)))
                            .limit(1)
                            .then(function (r) { return r[0] || null; })];
                case 3:
                    existing = _b.sent();
                    if (!!existing) return [3 /*break*/, 5];
                    numero = extrairNumero(remoteJid);
                    descricaoParts = [];
                    if (dados.produto)
                        descricaoParts.push("Produto: ".concat(dados.produto));
                    if (dados.documento)
                        descricaoParts.push("Documento: ".concat(dados.documento));
                    if (dados.tipoPessoa)
                        descricaoParts.push("Tipo: ".concat(dados.tipoPessoa));
                    if (dados.empresaNome)
                        descricaoParts.push("Empresa: ".concat(dados.empresaNome));
                    return [4 /*yield*/, db_1.db
                            .insert(crm_leads_1.crmLeads)
                            .values({
                            nome: dados.nome,
                            email: dados.email || null,
                            celular: numero,
                            empresaNome: dados.tipoPessoa === "PJ" ? (dados.empresaNome || dados.nome) : null,
                            origem: "WHATSAPP",
                            descricao: descricaoParts.length > 0 ? descricaoParts.join(" | ") : null,
                            idIntegracao: "whatsapp:".concat(remoteJid),
                        })
                            .returning()];
                case 4:
                    novo = (_b.sent())[0];
                    lead = novo;
                    _b.label = 5;
                case 5: return [2 /*return*/, server_1.NextResponse.json(__assign(__assign({}, atualizada), { lead: lead }))];
                case 6:
                    error_2 = _b.sent();
                    console.error("[POST /api/crm/whatsapp/conversa]", error_2);
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Erro interno" }, { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3;
