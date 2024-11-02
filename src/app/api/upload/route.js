import { NextResponse } from "next/server";
import { conn } from "../libs/mysql";

export async function POST(request) {
  try {
    const { data } = await request.json(); // Recibe los datos enviados desde el frontend

    // Verificar si hay datos
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos" },
        { status: 400 }
      );
    }

    // Preparar los valores para la consulta SQL, incluyendo `fecha_envio`
    const values = data.map(
      ({ nombre, codigo_area, celular, mensaje, fecha_envio }) => [
        nombre,
        codigo_area,
        celular,
        mensaje,
        fecha_envio, // Agregar fecha_envio proporcionada desde el cliente
      ]
    );

    // Crear la consulta SQL para la inserción masiva
    const query = `
      INSERT INTO clientes (
        nombre,
        codigo_area,
        telefono,
        mensaje,
        fecha_envio
      ) 
      VALUES ?
    `;

    // Ejecutar la consulta de inserción masiva
    const [result] = await conn.query(query, [values]);

    return NextResponse.json({
      message: "Datos insertados exitosamente",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error al insertar datos:", error);
    return NextResponse.json(
      {
        message: "Error al insertar datos en la base de datos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
