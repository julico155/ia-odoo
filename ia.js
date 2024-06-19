const axios = require('axios');
const OpenAI = require('openai');
const express = require('express');

const openai = new OpenAI({
    apiKey: '', // Reemplaza con tu clave API
});

const app = express();
const port = 4322;

// Función para obtener las calificaciones del estudiante y generar el informe
async function generateStudentReport(studentId) {
    try {
        // Obtener las calificaciones del estudiante desde la API
        const response = await axios.get('http://localhost:3000/api/studentsgrades', {
            params: { student_id: studentId }
        });

        const grades = response.data;

        // Procesar las calificaciones y generar el informe usando OpenAI
        const reportText = await createReportText(grades);
        return reportText;
    } catch (error) {
        console.error('Error al obtener las calificaciones:', error);
        return 'Error al obtener las calificaciones';
    }
}

// Función para crear el texto del informe
async function createReportText(grades) {
    const gradeDescriptions = grades.map(grade => {
        return `En la materia de ${grade.subject_id[1]} del curso ${grade.course_id[1]} (${grade.academic_term_id[1]}), obtuvo una calificación de ${grade.grade}.`;
    }).join(' ');

    const prompt = `
    Dado el siguiente conjunto de calificaciones para un estudiante, crea un informe resaltando en lo que el estudiante es bueno y en lo que debe mejorar:
    ${gradeDescriptions}
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 250,
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar el informe:', error);
        return 'No se pudo generar el informe en este momento.';
    }
}

// Ruta para generar el informe del estudiante
app.get('/report/:studentId', async (req, res) => {
    const studentId = req.params.studentId;
    const report = await generateStudentReport(studentId);
    res.send(report);
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
