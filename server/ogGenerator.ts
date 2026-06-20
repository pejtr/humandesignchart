import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { HumanDesignChartData } from '@shared/types';
import fs from 'fs';
import path from 'path';

let fontBufferRegular: ArrayBuffer | null = null;
let fontBufferBold: ArrayBuffer | null = null;

async function getFonts() {
    if (fontBufferRegular && fontBufferBold) {
        return { regular: fontBufferRegular, bold: fontBufferBold };
    }

    // Load standard Inter fonts from Google Fonts via simple TTF links
    const [resReg, resBold] = await Promise.all([
        fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"),
        fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf")
    ]);

    if (!resReg.ok || !resBold.ok) {
        throw new Error("Failed to load fonts for satori");
    }

    fontBufferRegular = await resReg.arrayBuffer();
    fontBufferBold = await resBold.arrayBuffer();

    return { regular: fontBufferRegular, bold: fontBufferBold };
}

export async function generateOGImage(
    chartData: HumanDesignChartData,
    ownerName?: string | null
): Promise<Buffer> {
    const fonts = await getFonts();

    const typeTranslations: Record<string, string> = {
        "Manifestor": "Manifestor",
        "Generator": "Generátor",
        "Manifesting Generator": "Manifestující Generátor",
        "Projector": "Projektor",
        "Reflector": "Reflektor"
    };

    const translatedType = typeTranslations[chartData.type] || chartData.type;
    const name = ownerName ? ownerName : "Human Design Mapa";

    // Use raw objects instead of TSX to ensure full compatibility with esbuild on Node backend
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    // Rich purple/blue gradient matching the app's mystical theme
                    background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
                    fontFamily: '"Inter"',
                    color: '#ffffff',
                    position: 'relative'
                },
                children: [
                    // Background decorative elements
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                top: '-50px',
                                right: '-50px',
                                width: '400px',
                                height: '400px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '50%',
                                filter: 'blur(40px)',
                            }
                        }
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute',
                                bottom: '-50px',
                                left: '-50px',
                                width: '300px',
                                height: '300px',
                                background: 'rgba(0, 195, 255, 0.05)',
                                borderRadius: '50%',
                                filter: 'blur(30px)',
                            }
                        }
                    },
                    // Main content container
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '60px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '32px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '30px'
                                        },
                                        children: [
                                            {
                                                type: 'span',
                                                props: {
                                                    style: {
                                                        fontSize: '28px',
                                                        fontWeight: 400,
                                                        color: 'rgba(255, 255, 255, 0.6)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '4px'
                                                    },
                                                    children: 'Human Design'
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: 'h1',
                                    props: {
                                        style: {
                                            fontSize: '76px',
                                            fontWeight: 700,
                                            margin: '0',
                                            marginBottom: '10px',
                                            color: '#ffffff',
                                            textAlign: 'center',
                                            lineHeight: '1.2'
                                        },
                                        children: name
                                    }
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'row',
                                            gap: '20px',
                                            marginTop: '30px',
                                        },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        display: 'flex',
                                                        padding: '16px 32px',
                                                        background: 'rgba(255,255,255,0.15)',
                                                        borderRadius: '16px',
                                                        fontSize: '32px',
                                                        fontWeight: 600,
                                                    },
                                                    children: translatedType
                                                }
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        display: 'flex',
                                                        padding: '16px 32px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '16px',
                                                        fontSize: '32px',
                                                        fontWeight: 400,
                                                    },
                                                    children: `Profil ${chartData.profile}`
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            padding: '12px 24px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '12px',
                                            fontSize: '26px',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginTop: '25px',
                                        },
                                        children: `Autorita: ${chartData.authority}`
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        } as any,
        {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' }
            ]
        }
    );

    const resvg = new Resvg(svg, {
        background: '#1A1A2E',
        fitTo: { mode: 'width', value: 1200 },
    });

    const pngData = resvg.render();
    return pngData.asPng();
}
