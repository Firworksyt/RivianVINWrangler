function decodeVin() {
    const vinInput = document.getElementById('vinInput').value;
    const vin = vinInput.trim();
    const resultDiv = document.getElementById('result');
    const vinRegex = /^(7FC|7PD|7FE)[A-Z0-9]{14}$/;

    if (!vinRegex.test(vin)) {
        resultDiv.innerHTML = "<p>Please enter a valid Rivian VIN (must start with '7FC', '7PD', or '7FE' and be 17 characters long).</p>";
        return;
    }

    let decodeEngine;
    if (['M', 'N', 'P', 'R'].includes(vin.charAt(9))) {
        decodeEngine = decodeEnginePre2025;
    } else if (vin.charAt(9) === 'S') {
        decodeEngine = decodeEnginePost2025;
    } else {
        decodeEngine = decodeEnginePre2025; // Default to pre-2025 if uncertain
    }

    const decoded = {
        "WMI": decodeWMI(vin.substring(0, 3)),
        "Model Line / Body Style": decodeModelLine(vin.charAt(3)),
        "GVWR / Brake System": decodeGVWR(vin.charAt(4)),
        "Engine / Motor / Drivetrain": decodeEngine(vin.charAt(5)),
        "Restraints": decodeRestraints(vin.charAt(6)),
        "Trim": decodeTrim(vin.charAt(7)),
        "Check Digit": checkVin(vin),
        "Model Year": decodeYear(vin.charAt(9)),
        "Manufacturing Plant": decodePlant(vin.charAt(10)),
        "Serial Number": vin.substring(11)
    };

    resultDiv.innerHTML = `<pre>${JSON.stringify(decoded, null, 2)}</pre>`;
}

function decodeWMI(wmi) {
    const map = {
        '7FC': 'Rivian, Vehicle Type: Truck',
        '7PD': 'Rivian, Vehicle Type: Multi-Purpose Passenger Vehicle (MPV)',
        '7FE': 'Rivian, Vehicle Type: EDV; Van'
    };
    return map[wmi] || 'Unknown WMI';
}

function decodeModelLine(line) {
    const map = {
        'T': 'R1T 4-door Pickup Truck',
        'S': 'R1S 4-door MPV',
        'D': 'RCV-Delivery; Van',
        'E': 'EDV; Van'
    };
    return map[line] || 'Unknown Model Line';
}

function decodeGVWR(gvwr) {
    const map = {
        'G': '8,001 - 9,000 lbs (3,630 - 4,082 kg); Hydraulic Brakes',
        'F': '7,001 - 8,000 lbs (3,176 - 3,629 kg); Hydraulic Brakes',
        'H': '9,001 - 10,000 lbs (4,083 - 4,536 kg); Hydraulic Brakes'
    };
    return map[gvwr] || 'Unknown GVWR';
}

function decodeEnginePre2025(engine) {
    const map = {
        'A': 'Electric, Large Pack, Dual-Motor, AWD',
        'B': 'Electric, Large Pack, Quad-Motor, AWD',
        'C': 'Electric, Max Pack, Dual-Motor, AWD',
        'E': 'Electric, Standard Pack, Single-Motor, FWD'
    };
    return map[engine] || 'Unknown Engine';
}

function decodeEnginePost2025(engine) {
    const map = {
        'A': 'Electric, Quad-Motor, AWD',
        'B': 'Electric, Dual-Motor, AWD',
        'C': 'Electric, Tri-Motor, AWD',
        'E': 'Electric, Standard Pack, Single-Motor, FWD'
    };
    return map[engine] || 'Unknown Engine';
}

function decodeRestraints(restraints) {
    const map = {
        'A': '2x Front Row Airbags; 2x Knee Airbags; 2x Front Row Side Airbags; 2x Curtain Airbags; 2x Front Row 3-Point Seat Belts; 3x Second Row 3-Point Seat Belts',
        'B': '1x Driver Airbag; 1x Driver Side Airbag; 1x Driver Curtain Airbag; 1x Driver 3-Point Seat Belt; 1x Folding Jump Seat 3-Point Seat Belt'  // New restraint systems
    };
    return map[restraints] || 'Unknown Restraints';
}

function decodeTrim(trim) { //Changes for 2025 still need to be considered
    const map = {
        'A': 'Adventure',
        'L': 'Launch Edition',
        'E': 'Explore',
        '1': '500 LHD Fleet',
        '2': '700 LHD Fleet',
        '3': '500 LHD Fleet Export',
        '4': '500 RHD Fleet Export',
        '5': '500 LHD Commercial',
        '6': '700 LHD Commercial'
    };
    return map[trim] || 'Unknown Trim';
}

function decodeYear(year) {
    const map = {
        'M': '2021',
        'N': '2022',
        'P': '2023',
        'R': '2024',
        'S': '2025'
    };
    return map[year] || 'Unknown Year';
}

function decodePlant(plant) {
    const map = {
        'N': 'Normal, IL'
    };
    return map[plant] || 'Unknown Plant';
}

function calculateCheckDigit(vin) {
    const transliteration = {
        'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'J': 1,
        'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2, 'T': 3, 'U': 4,
        'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 0
    };

    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
        const numericValue = transliteration[vin[i].toUpperCase()];
        sum += numericValue * weights[i];
    }

    const remainder = sum % 11;
    return remainder === 10 ? 'X' : remainder.toString();
}

function checkVin(vin) {
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        return "Invalid VIN";
    }
    
    const providedCheckDigit = vin[8];
    const calculatedCheckDigit = calculateCheckDigit(vin);

    if (providedCheckDigit === calculatedCheckDigit) {
        return "Check OK";
    } else {
        return "Invalid VIN - Check Digit does not match";
    }
}
