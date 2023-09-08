function menuPage(heading,message,menu,response){
    let messageDescription = {
      heading: heading,
      message: message,
      menu: menu 
    };
    response.render('menuPage.ejs', messageDescription);
  }

  module.exports = menuPage;
