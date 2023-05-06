function messageDisplay(heading,message,menu,response){
    let messageDescription = {
      heading: heading,
      message: message,
      menu: menu 
    };
    response.render('messageDisplay.ejs', messageDescription);
  }

  module.exports = messageDisplay;
