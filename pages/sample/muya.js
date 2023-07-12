import React  from 'react'
export default function muya() {
    React.useEffect(async () => {
        const container = document.querySelector('#editor')
        const Muya  = await import('@marktext/muya')
        
    }, [])
    return <>
       <div id="editor"></div>
    </>
}