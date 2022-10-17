function Display({room, names}) {
    const blue = "#08467b"
    return <div style={{
        height: "15cm",
        width: "15cm",
        borderStyle: "solid",
        borderColor: "#eee",
        borderWidth: "1px",
        margin:"5px",
        position: "absolute",
        WebkitPrintColorAdjust: "exact", 
        printColorAdjust: "exact"
    }}>
        <img alt="" style={{
            height: "3cm",
            opacity: "0.8",
            marginTop: "0.2cm",
            marginLeft: "0.2cm",
            marginBottom: "-0.2cm"
            }} src="/img/matematica_dx.svg" />
        <div style={{
            height:"13cm",
            marginTop:"-2cm"
        }}>
            <div contentEditable="true" style={{
                color: blue,
                textAlign: "center",
                fontSize: "1cm",
                position: "relative",
                top: "50%",
                transform: "translateY(-50%)"
            }}>
                { names.map(name=>
                    <div key={name} style={{
                        }}>{name}</div>)}
            </div>
        </div>
        <div style={{
            marginTop: "-4cm",
            marginRight: "0.5cm"
        }}>
        <div contentEditable="true" style={{
            backgroundColor: blue,
            color: "white",
            width: "3cm",
            height: "3cm",
            fontSize: "1.5cm",
            textAlign: "right",
            paddingTop: ".5cm",
            paddingRight: "0.1cm",
            marginTop: "2cm",
            float: "left"
        }}>{room}</div>
        <img alt="" style={{
            height: "8cm",
            position: "relative",
            float: "right",
            opacity: "0.15",
            marginTop: "-3.2cm",
            marginRight: "-0.4cm",
            pointerEvents: "none"
            }} src="/img/cherubino_pant541.png" />
        </div>
    </div>
}

export default function CardPage() {
    return <>
    <p>Puoi modificare il nome e il numero di stanza.</p>
        <Display room="123" names={[
            "Nome Cognome"
            ]} />
        </>
}

