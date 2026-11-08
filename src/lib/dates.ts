import "server-only";

import { connection } from "next/server";

// "Ahora" de la petición. Marca el componente como dinámico (Cache Components
// no permite leer la hora en el shell estático) y mantiene puro el render.
export async function requestNow() {
  await connection();
  return new Date();
}
