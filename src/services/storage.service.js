const { Readable } = require('stream');
const supabase = require('../config/supabase');

const upload = async (bucket, storageKey, buffer, mimeType) => {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(storageKey, buffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) {
        throw new Error(`No se pudo subir el archivo al storage: ${error.message}`);
    }

    return { bucket, storageKey };
};

const download = async (bucket, storageKey) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(storageKey);

    if (error) {
        throw new Error(`No se pudo descargar el archivo del storage: ${error.message}`);
    }

    return data;
};

const stream = async (bucket, storageKey) => {
    const blob = await download(bucket, storageKey);
    return Readable.fromWeb(blob.stream());
};

const remove = async (bucket, storageKey) => {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([storageKey]);

    if (error) {
        throw new Error(`No se pudo eliminar el archivo del storage: ${error.message}`);
    }
};

const exists = async (bucket, storageKey) => {
    const segments = storageKey.split('/');
    const fileName = segments.pop();
    const folder = segments.join('/');

    const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, { search: fileName });

    if (error) {
        return false;
    }

    return Array.isArray(data) && data.some(item => item.name === fileName);
};

const signedUrl = async (bucket, storageKey, expiresInSeconds = 3600) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storageKey, expiresInSeconds);

    if (error) {
        throw new Error(`No se pudo firmar la URL del storage: ${error.message}`);
    }

    return data.signedUrl;
};

module.exports = {
    upload,
    download,
    stream,
    delete: remove,
    exists,
    signedUrl
};
