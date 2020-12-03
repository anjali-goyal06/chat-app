const socket = io()


//  Element names 
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendlocationButton = document.querySelector('#send-location')

const $messages =  document.querySelector('#messages')

const $messageTemplate = document.querySelector('#message-template').innerHTML 
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML 
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight
    
    // how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render($messageTemplate,{
        message : message.text ,
        createdAt : moment(message.createdAt).format('hh:mm a ') ,
        username : message.username
    })

    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
   // console.log(msg)
    const html = Mustache.render($locationMessageTemplate,{
        username: message.username, 
        message : message.url, 
        createdAt : moment(message.createdAt).format('hh:mm a ')
    })

    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room , users})=> {
    const html = Mustache.render(sidebarTemplate,{
        room , 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    console.log("1   2 checkkkkkk")
    const message = document.querySelector('input').value
    socket.emit('sendmessage',message,(error)=>{

        $messageFormButton.removeAttribute('disabled')
        console.log("checkkkkkk")
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            console.log(error)
        }
        console.log('The message is delivered')
    })
})

$sendlocationButton.addEventListener('click',()=>{


    if(!navigator.geolocation){
        return alert('Browser does not support location info')
    }

    $sendlocationButton.setAttribute('disabled','disabled')

    
    navigator.geolocation.getCurrentPosition((position)=>{
        //console.log(position)
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            console.log('Location Shared')
            $sendlocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username , room }, (error) => {
    if(error){
        alert(error)
        location.href =  '/'
    }
})