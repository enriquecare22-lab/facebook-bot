const fetch = require("node-fetch");
const { Firestore } = require("@google-cloud/firestore");

// Inicializa Firestore
const firestore = new Firestore();

// 🔹 Función principal
exports.publicarPost = async (req, res) => {
    try {
        // 1. Generar imagen + caption con Gemini
        const tema = elegirTemaAleatorio();
        const { imagenBase64, caption } = await generarConGemini(tema);

        // 2. Subir imagen a Imgur
        const urlImagen = await subirImgur(imagenBase64);

        // 3. Guardar metadatos en Firestore
        const docRef = firestore.collection("posts").doc();
        await docRef.set({
            tema,
            caption,
            url: urlImagen,
            fecha: new Date().toISOString(),
            estado: "pendiente",
        });

        // 4. Publicar en Facebook con Meta Graph API
        await publicarFacebook(urlImagen, caption);

        // 5. Actualizar estado
        await docRef.update({ estado: "publicado" });

        res.status(200).send("Post publicado correctamente");
    } catch (error) {
        console.error("Error en flujo:", error);
        res.status(500).send("Error al publicar");
    }
};

// 🔹 Función auxiliar: elegir tema aleatorio
function elegirTemaAleatorio() {
    const temas = ["dragón", "mitología griega", "samurái", "universo"];
    return temas[Math.floor(Math.random() * temas.length)];
}

// 🔹 Gemini API (ejemplo simplificado)
async function generarConGemini(tema) {
    // Aquí llamas a Gemini API con tu prompt
    // Simulación: devuelve imagen en base64 y caption
    return {
        imagenBase64: "BASE64_IMAGE_STRING",
        caption: `Arte temático de ${tema}`,
    };
}

// 🔹 Subir a Imgur
async function subirImgur(base64Image) {
    const response = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
            Authorization: "Client-ID TU_CLIENT_ID",
        },
        body: new URLSearchParams({
            image: base64Image,
            type: "base64",
        }),
    });

    const data = await response.json();
    return data.data.link; // URL pública
}

// 🔹 Publicar en Facebook
async function publicarFacebook(urlImagen, caption) {
    const pageId = "TU_PAGE_ID";
    const accessToken = "TU_ACCESS_TOKEN";

    // Subir foto
    const photoRes = await fetch(
        `https://graph.facebook.com/${pageId}/photos?url=${encodeURIComponent(
            urlImagen
        )}&access_token=${accessToken}`,
        { method: "POST" }
    );

    if (!photoRes.ok) throw new Error("Error al subir foto a Facebook");

    // Publicar caption
    const feedRes = await fetch(
        `https://graph.facebook.com/${pageId}/feed?message=${encodeURIComponent(
            caption
        )}&access_token=${accessToken}`,
        { method: "POST" }
    );

    if (!feedRes.ok) throw new Error("Error al publicar caption en Facebook");
}
