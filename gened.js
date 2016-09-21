
var firstBoxX = 50;
var firstBoxY = 130;
var boxWidth = 150;
var boxPadding = 20;

var topMargin = 15;
var leftMargin = 15;
var rightMargin = 15;

var ellipseW1 = 10;
var ellipseW2 = 6;

module.exports = function(socket,doc,pdfConfig,mode){
	switch(mode){
		case 'coverpage':
			//doc.image(app.get('persistentDataDir')+'img/gened.png',50,50,{fit : [75,75]});
			doc.image('./public/img/gened.png',50,50,{fit : [75,75]});
			doc.font('Helvetica').fontSize(32).text('Generation Education',125,95);
			doc.font('Times-Roman').fontSize(50).text('Mock Exam',60,380,{
				width : 500,
			})
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
			
			
			doc.font('Helvetica').fontSize(16).text('English',firstBoxX+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 5;
			for (var i = 1; i<21; i++){
				drawCircle(firstBoxX,doc.y,i,doc)
			}
			doc.lineJoin('round').rect(firstBoxX,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
			doc.font('Helvetica').fontSize(16).text('Mathematics',firstBoxX+boxWidth+boxPadding+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 5;
			for (var i = 1; i<21; i++){
				drawCircle(firstBoxX+boxWidth+boxPadding,doc.y,i,doc)
			}
			doc.lineJoin('round').rect(firstBoxX+boxWidth+boxPadding,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
			doc.font('Helvetica').fontSize(16).text('GA',firstBoxX+2*boxWidth+2*boxPadding+leftMargin,firstBoxY+topMargin,{width:boxWidth-leftMargin-rightMargin,align:'center'})
			doc.y += 5;
			for (var i = 1; i<31; i++){
				drawCircle(firstBoxX+2*boxWidth+2*boxPadding,doc.y,i,doc)
			}
			doc.lineJoin('round').rect(firstBoxX+2*boxWidth+2*boxPadding,firstBoxY,boxWidth,doc.y-firstBoxY).stroke();
			
		break;
	}
}

function drawCircle(left,top,idx,doc){
	doc.fillColor('#000').fontSize(12).text(idx,left+leftMargin,top,{width:20,align:'center'})
	
	for (var j = 0; j<4; j++){
		doc.fillColor('#666').fontSize(8).text(mc[j],left+35+j*25,top,{width:ellipseW1*2,align:'center'});
		doc.ellipse(left+35+j*25+ellipseW1,top+4,ellipseW1,ellipseW2)
	}
	
	if((idx)%5==0){
		doc.y += 12;
	}else{
		doc.y += 5;
	}
}

var mc = ['A','B','C','D'];