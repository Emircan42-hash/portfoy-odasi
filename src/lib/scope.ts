import type { Session } from "next-auth";

type PanelUser = Session["user"];

/** Şirket sahibi ofisin tamamını, danışman yalnız kendi kayıtlarını görür. */
export function propertyScope(user: PanelUser) {
  return user.role === "OWNER" ? { officeId: user.officeId } : { agentId: user.id };
}

export function roomScope(user: PanelUser) {
  return user.role === "OWNER" ? { agent: { officeId: user.officeId } } : { agentId: user.id };
}
