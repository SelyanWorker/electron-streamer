let dispalyFlag = true
setInterval(()=>{
	if (dispalyFlag)
		document.body.style.display = 'block'
	else document.body.style.display = 'none'

	dispalyFlag = !dispalyFlag
}, 400)
