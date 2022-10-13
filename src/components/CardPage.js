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
    }}>
        <img alt="" style={{
            height: "3cm",
            opacity: "0.8",
            marginTop: "0.2cm",
            marginLeft: "0.2cm",
            marginBottom: "-0.2cm"
            }} src="/img/matematica_dx.svg" />
        <div contentEditable="true" style={{
            color: blue,
            textAlign: "center",
            fontSize: "1cm",
            height: "8cm",
            paddingTop: "1cm"
        }}>
            { names.map(name=>
                <div key={name} style={{
                    }}>{name}</div>)}
        </div>
        <div style={{
            marginTop: "-1cm",
            marginRight: "0.5cm"
        }}>
        <div alt="" contentEditable="true" style={{
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
        <img style={{
            height: "5cm",
            position: "relative",
            float: "right",
            opacity: "0.5",
            marginTop: "-0.2cm",
            marginRight: "-0.3cm"
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

