"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as ExcelJS from "exceljs";
import { Toaster, toast } from "sonner";
import axios from "axios";

export default function Component() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [dbData, setDbData] = useState([]);

  // Función para convertir texto a formato "Proper Case"
  const toProperCase = (str) => {
    if (!str) return ""; // Manejar el caso de texto vacío o undefined
    return str
      .split(" ") // Separar el texto en palabras
      .map((word) => {
        if (word.length === 0) return ""; // Evitar errores con palabras vacías
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalizar la primera letra y poner en minúsculas el resto
      })
      .join(" "); // Volver a unir las palabras en un solo string
  };

  // Función para procesar el archivo Excel
  const processExcelFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const workbook = new ExcelJS.Workbook();
      try {
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1); // Obtener la primera hoja

        // Verifica si el worksheet está definido
        if (!worksheet) {
          throw new Error("No se encontró la hoja de cálculo.");
        }

        const data = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            const rowData = {
              id: row.getCell(1)?.value,
              nombres: toProperCase(row.getCell(2)?.value), // Aplicar la función
              apellidos: toProperCase(row.getCell(3)?.value), // Aplicar la función
              codigo_area: row.getCell(4)?.value,
              celular: row.getCell(5)?.value,
              mensaje: row.getCell(6)?.value,
            };
            data.push(rowData);
          }
        });

        // Concatenar nombres y apellidos en un solo campo "nombre"
        const processedData = data.map((row) => ({
          ...row,
          nombre: `${row.nombres} ${row.apellidos}`,
        }));

        console.log("Datos del Excel:", processedData);
        setDbData(processedData);
        setPreviewData(processedData);
        toast.info(
          'Archivo procesado. Revisa la vista previa y presiona "Subir datos" para continuar.'
        );
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
        toast.error(
          "No hay datos para subir. Por favor, selecciona un archivo Excel primero."
        );
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLoading(true);
      setPreviewData([]);
      await processExcelFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      toast.error(
        "No hay datos para subir. Por favor, selecciona un archivo Excel primero."
      );
      return;
    }

    setLoading(true);
    toast.info("Subiendo datos...");

    try {
      // Aquí se realiza la solicitud POST para enviar los datos
      const response = await axios.post("/api/upload", {
        data: dbData,
      });

      if (response.status === 200) {
        toast.success("Datos subidos exitosamente a la base de datos.");
      } else {
        toast.error("Hubo un problema al subir los datos.");
      }
    } catch (error) {
      console.error("Error al subir los datos:", error);
      toast.error("Ocurrió un error al subir los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-4xl mx-auto my-10">
        <CardHeader>
          <CardTitle>Carga de Archivo Excel</CardTitle>
          <CardDescription>
            Sube un archivo Excel para procesar su información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="excel-file">Archivo Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
        {previewData.length > 0 && (
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">
              Vista previa de datos:
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Código Área</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.nombres}</TableCell>
                      <TableCell>{row.apellidos}</TableCell>
                      <TableCell>{row.codigo_area}</TableCell>
                      <TableCell>{row.celular}</TableCell>
                      <TableCell>{row.mensaje}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex flex-col items-start space-y-2">
          <Button
            onClick={handleUpload}
            disabled={loading || previewData.length === 0}
          >
            {loading ? "Procesando..." : "Subir datos"}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
