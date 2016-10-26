
var firstBoxX = 50;
var firstBoxY = 160;
var boxWidth = 150;
var boxPadding = 20;

var topMargin = 15;
var leftMargin = 15;
var rightMargin = 15;

var ellipseW1 = 10;
var ellipseW2 = 6;

var shortCode;

var boxLineWidth = 1;
var boxLineColor = '#ccc'

var circleLineWidth = 1;
var circleLineColor = '#ccc'

module.exports = function(socket,doc,pdfConfig,mode){
	switch(mode){
		case 'coverpage':
			socket.request.user.notes1.replace(/customShortcode\:.*?\;/,function(s){
				shortCode = s.replace(/customShortcode\:|\;/g,'')
			})
			
			socket.request.user.notes1.replace(/customCounter\:.*?\;/,function(s){
				shortCode += s.replace(/customCounter\:|\;/g,'')
			})
			
			doc.image('./public/img/gened.png',50,50,{fit : [75,75]});
			doc.font('Helvetica').fontSize(32).text('Generation Education',125,95);
			doc.font('Times-Roman').fontSize(50).text('Mock OC Exam',60,380,{
				width : 500,
			})
			doc.font('Times-Roman').fontSize(14).text('Short Code:'+shortCode,60,660);
			doc.font('Times-Roman').fontSize(14).text('Powered by examcopedia',60,680);
			doc.font('Times-Italic').fontSize(12);
			doc.text('gen-ed.com.au',80,doc.y);
			doc.text('jimmy@gen-ed.com.au');
			
			doc.fontSize(12).font('Times-Roman');
			doc.lineWidth(pdfConfig.lineWidth);
		break;
		case 'header':
			doc.font('Times-Italic').text('Generation Education',50,38,{width : doc.width, align:'center'});
		break;
		case 'pdf info':
			doc.info['Title'] = 'mock exam';
			doc.info['Author'] = 'Generation Education, powered by Examcopedia, put together by pandamakes';			
		break;
		case 'pre end':
			doc.addPage();
			doc.image('./public/img/gened.png',50,50,{fit : [75,75]});
			//doc.font('Helvetica').fontSize(10).text('Generation Education',50,120,{width:75, align:'center'});
			doc.font('Helvetica').fontSize(32).text('Answer Sheet',125,95,{align:'left'});
			
			doc.fontSize(10).text('Name: _____________________  Date: _____________________  Short Code:',50,140,{align:'left'})
			doc.rect(410,136,60,14).fillAndStroke('#000','#000')
			doc.fillColor('#FFF').text(shortCode,420,140)
			
			doc.fillColor('#000').font('Helvetica').fontSize(16).text('English',firstBoxX+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 12;
			for (var i = 1; i<21; i++){
				drawCircle(firstBoxX,doc.y,i,doc)
			}
			doc.strokeColor(boxLineColor).lineWidth(boxLineWidth).lineJoin('round').rect(firstBoxX,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
			doc.fillColor('#000').font('Helvetica').fontSize(16).text('Mathematics',firstBoxX+boxWidth+boxPadding+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 12;
			for (var i = 1; i<21; i++){
				drawCircle(firstBoxX+boxWidth+boxPadding,doc.y,i,doc)
			}
			doc.strokeColor(boxLineColor).lineWidth(boxLineWidth).lineJoin('round').rect(firstBoxX+boxWidth+boxPadding,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
			doc.fillColor('#000').font('Helvetica').fontSize(16).text('GA',firstBoxX+2*boxWidth+2*boxPadding+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 12;
			for (var i = 1; i<31; i++){
				drawCircle(firstBoxX+2*boxWidth+2*boxPadding,doc.y,i,doc)
			}
			doc.strokeColor(boxLineColor).lineWidth(boxLineWidth).lineJoin('round').rect(firstBoxX+2*boxWidth+2*boxPadding,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
		break;
	}
	return shortCode;
}

function drawCircle(left,top,idx,doc){
	doc.fillColor('#666').fontSize(12).text(idx,left+leftMargin,top,{width:20,align:'center'})
	
	for (var j = 0; j<4; j++){
		doc.fillColor('#666').fontSize(8).text(mc[j],left+35+j*25,top+1,{width:ellipseW1*2,align:'center'});
		doc.strokeColor(circleLineColor).lineWidth(circleLineWidth).ellipse(left+35+j*25+ellipseW1,top+4,ellipseW1,ellipseW2).stroke()
	}
	
	if((idx)%5==0){
		doc.y += 12;
	}else{
		doc.y += 5;
	}
}

/* make 4 random characters */
/* http://stackoverflow.com/a/1349426/6059235 */
function makeid(){
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    for( var i=0; i < 4; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var mc = ['A','B','C','D'];