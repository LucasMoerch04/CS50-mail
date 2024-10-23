document.addEventListener('DOMContentLoaded', function() {


  window.onload = function() {
  Particles.init({
    selector: '.background',
    connectParticles: true,
    color: ['#F9FFFB'],

    });
  };

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form-form').addEventListener('submit', () => {
    // Get values
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;
    // Post values
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
          read: false
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log("sent");
        load_mailbox('sent')

    });
  })




  function compose_email(recipients = "", subject = "", body = "", timestamp = "") {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Prefill values
    if (subject !== "" && !subject.startsWith("Re:")){
      subject = "Re: " + subject;
    }

    if (body !== ""){
      body = "On " + timestamp + " " + recipients + " "+ "wrote: " + body + "\n\n";
    }

    if (recipients == "[object PointerEvent]"){
      recipients = ""
    }

    // Insert composition fields
    let compRecipients = document.querySelector('#compose-recipients');
    let compSubject = document.querySelector('#compose-subject');
    let compBody = document.querySelector('#compose-body');

    compRecipients.value = recipients;
    compSubject.value = subject;
    compBody.value = body;
    compBody.style = "font-style: italic";
  

  }
  
  
  function load_mailbox(mailbox) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
  
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3 id="mailbox">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // Get or create the 'mails-container' element
    let mails_con = document.querySelector('#mails-container');

    const clear = function(){
    if (!mails_con) {
      // Create 'mails-container' element if it doesn't exist
      mails_con = document.createElement('div');
      mails_con.id = 'mails-container';
      document.querySelector('#emails-view').appendChild(mails_con);
    } else {
       // Clear existing content if 'mails-container' already exists
      mails_con.innerHTML = '';
    }
    }
    
    clear();
      
    
    
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);
        // Create div for each email
        emails.forEach(mail => {
          console.log(mail)
          let mail_div = document.createElement('div');
          mail_div.className = "email-item";
          mail_div.id = `email-${mail.id}`
          let archiveStatus = mail.archived ? "color: #AEB9B3;" : "color: #77A38B;"; 
          let readStatus = mail.read ? "readColor" : "unreadColor"; 


          if (!mail.read) {
            mail_div.classList.add("unreadStyle");
          } else {
            mail_div.classList.add("readStyle");
          }

          mail_div.innerHTML = `
          <span id="subject"> ${mail.subject} </span>
          <span id="sender"> ${mail.sender} </span>
          <span id="timestamp"> ${mail.timestamp} </span>

          `
          if (mailbox != "sent"){
            mail_div.innerHTML += `
            <div class="archive"><button class="archive_button" type="submit" onclick="archive(${mail.id}, ${mail.archived})"><i class="fa-solid fa-box-archive archive_button" style="${archiveStatus}"></i></button></div>
            <div class="readIcon"><button class="read_button" type="submit" onclick="read(${mail.id})"><i class="fa-solid fa-eye ${readStatus} read_button${mail.id}"></i></button></div>`
          }
          ;

          
          // Onclick function
          mail_div.addEventListener('click', function(event) {
            if (!event.target.classList.contains("archive_button") && !event.target.classList.contains(`read_button${mail.id}`)){
              console.log('This element has been clicked!');
              fetch(`/emails/${mail.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    read: false
                })
              })

              const view_email = function(){
                clear();
                let mail_div = document.createElement('div');
                mail_div.className = "email-item-view";
                mail_div.id = `email-${mail.id}`
                

                mail_div.innerHTML = `
                <div class="archive"><button class="archive_button" type="submit" onclick="archive(${mail.id}, ${mail.archived}, true)"><i class="fa-solid fa-box-archive archive_button" style="${archiveStatus}"></i></button></div>
                <div class="viewBox">
                <div class="viewSubject"> ${mail.subject}</div>
                <div class="viewTimestamp"> ${mail.timestamp}</div>
                <div class="viewSender"> From: ${mail.sender}</div>
                <div class="viewRecipients"> To: ${mail.recipients}</div>
                <div class="viewBody"> ${mail.body}</div>
                <div class="viewReply"><button class="navBtn reply" type="submit">Reply</button></div>
                </div>

                `
                ;
                mails_con.append(mail_div);

                mail_div.addEventListener('click', function(event) {
                  if (event.target.classList.contains("reply")) {
                    // Get the mail details
                    console.log("test")
                    // Call the compose_email function with mail details
                    compose_email(mail.recipients, mail.subject, mail.body, mail.timestamp)
                    }
                })


              }
              view_email();
            }
            
        
          });
            mails_con.append(mail_div);
          });
    });
    
    
  

  }
  
});



function archive(id, archive, view = false){
  // Reverts 'archived' status

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(mail => {
      let archiveStatus = mail.archived ? false : true;
    
  

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archiveStatus
    })
  })
  .then(response => {
    if (response.ok) {
      console.log(`Email ${id} archived successfully.`);
      // Hide the email item after archiving
      if (!view){
        let mail_div = document.getElementById(`email-${id}`);
        console.log(mail_div)
        if (mail_div) {
          mail_div.style.display = "none";
        }
      }
      else{
        let archiveColor = archiveStatus ? "color: #AEB9B3;" : "color: #77A38B;";
        document.querySelector(`#email-${id} .archive_button i`).style = archiveColor;
        console.log(archiveStatus)
      }
      
    } 
  })
})
}

function read(id){
  // Reverts 'read' status

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(mail => { 
    let readStatus = mail.read ? false : true; 

    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: readStatus
      })
    })
    .then(response => {
      if (response.ok) {
        console.log(`Email ${id} readStatus changed successfully.`);
        // Change style
        let mail_div = document.getElementById(`email-${id}`);
        let read_icon = document.querySelector(`.read_button${id}`)
        if (mail_div && read_icon && !readStatus) {
          mail_div.classList.add("unreadStyle");
          mail_div.classList.remove("readStyle");
          read_icon.classList.add("unreadColor");
          read_icon.classList.remove("readColor");
          console.log("1")

  
        }
        else{
          mail_div.classList.remove("unreadStyle");
          mail_div.classList.add("readStyle");
          read_icon.classList.remove("unreadColor");
          read_icon.classList.add("readColor");
          console.log("2")

        }
      } 
    })
  })


  
}
