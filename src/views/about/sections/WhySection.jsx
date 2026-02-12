import React from 'react';
import { Typography } from "@material-tailwind/react";
import { ArrowDownIcon, QuestionMarkCircleIcon, DevicePhoneMobileIcon, 
    ExclamationTriangleIcon, CogIcon, EyeSlashIcon, HeartIcon } from "@heroicons/react/24/outline";
import GridBackground from '../../../components/shared/GridBackground';
import { appColors } from '../../../styles/colors';

export default function WhySection({ currentSlide, getSectionOpacity }) {
    return (
        <section
            className="absolute inset-0 flex flex-col px-6 md:px-12 py-8 z-2 items-center justify-center overflow-y-auto"
            style={{
                opacity: getSectionOpacity(1),
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: getSectionOpacity(1) > 0.5 ? 'auto' : 'none'
            }}
        >
            {/* Title Row */}
            <div className="w-full z-50 px-4 flex-shrink-0 mb-4">
                <div className="flex items-center">
                    {/* Left Third */}
                    <div className="flex flex-col gap-1 text-left">
                        <Typography type="h5" className="font-body text-sm md:text-base font-light text-graphite italic ">
                        "If only i could copy this really long password to this really shady computer, we could achieve world peace. 
                        <br/>Alas! I'm going to type it manually......"
                        </Typography>
                        <Typography className="italic text-xs md:text-sm font-body text-graphite">- Someone Definitely</Typography>
                    </div>
                </div>
            </div>

            {/* Content Grid - 1 text row + 1 large container for remaining rows */}
            <div className="flex-1 relative w-full flex flex-col gap-2 z-80">

                    {/* Row 1 - Text Content */}
                    <div className="flex-shrink-0 flex flex-col justify-center text-center px-4 py-2 z-30 mb-2">
                        <Typography type="h1" className="font-header text-xl md:text-2xl font-light text-white">
                        Secure passwords are annoying to type and easy to mess up.
                        </Typography>
                    </div>
                    
                    {/* Container - flex-1 fills remaining space */}
                    <div 
                        className="flex-1 flex flex-col gap-0 w-full bg-background/60 px-4 md:px-8 py-8
                        border-t-2 border-white text-center z-40 min-h-0 overflow-hidden"
                        style={{ boxShadow: '0 0 50px rgba(255, 255, 255, 0.3)' }}
                    >   
                        {/* Top 1/3 - "So I made ToothPaste" */}
                        <div className="flex items-center justify-center z-60 py-4 flex-shrink-0">
                            <Typography className="font-header text-5xl md:text-6xl font-semibold text-dust leading-relaxed">
                                <span className='font-light'>So I made</span> ToothPaste.
                            </Typography>
                        </div>

                        {/* Bottom 2/3 - 3 columns */}
                        <div className="flex-1 flex gap-3 md:gap-6 w-full py-6 md:py-12 px-2 md:px-8 min-h-0">
                            {/* Column 1 */}
                            <div className="flex-1 border-2 rounded-lg border-secondary bg-ink shadow-lg shadow-secondary h-full p-3 md:p-4 flex flex-col items-center">
                                <CogIcon 
                                    className="h-1/4 w-1/4 text-secondary flex-shrink-0 mb-2" 
                                    style={{ filter: `drop-shadow(0 0px 3px ${appColors.secondary})` }}
                                />
                                <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-h-0">
                                    <Typography className="font-body text-sm md:text-base lg:text-lg font-light text-text leading-relaxed">
                                    As a maker and tinkerer, I often find myself needing to quickly paste passwords, commands, 
                                    or text snippets into devices that aren't connected to the internet.
                                    </Typography>
                                </div>
                            </div>
                            
                            {/* Column 2 */}
                            <div className="flex-1 border-2 rounded-lg border-orange bg-ink shadow-lg shadow-orange h-full p-3 md:p-4 flex flex-col items-center">
                                <EyeSlashIcon className="h-1/4 w-1/4 text-orange flex-shrink-0 mb-2"
                                    style={{ filter: `drop-shadow(0 0px 3px ${appColors.orange})` }}/>
                                
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 overflow-y-auto min-h-0">
                                    <Typography className="font-body text-sm md:text-base lg:text-lg font-light text-text leading-relaxed">
                                    And sometimes I just don't want to login to my password manager on some a sketchy makerspace computer.
                                    </Typography>
                                    
                                    <div className="text-center flex-shrink-0">
                                        <Typography className="font-body text-base md:text-lg font-bold text-text">
                                        Or... I'm just lazy
                                        </Typography>
                                        <Typography className="font-body text-xs font-extralight text-text italic">
                                        this might be the real reason
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Column 3 */}
                            <div className="flex-1 border-2 rounded-lg border-primary bg-ink shadow-lg shadow-primary h-full p-3 md:p-4 flex flex-col items-center">
                                <HeartIcon className="h-1/4 w-1/4 text-primary flex-shrink-0 mb-2" 
                                    style={{ filter: `drop-shadow(0 0px 3px ${appColors.primary})` }}/>
                                <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto gap-4 min-h-0">
                                    <Typography className="font-body text-sm md:text-base lg:text-lg font-light text-text">
                                    And I just needed a reason to solder some stuff and write some code 
                                    </Typography>
                                    <Typography className="font-body text-sm md:text-base lg:text-lg font-light text-text">
                                    And then I went a bit overboard. 
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Centered Scroll Prompt at Bottom */}
            <div className="flex items-center justify-center gap-2 text-white flex-shrink-0 mt-2 text-sm">
                <ArrowDownIcon className="h-4 w-4 animate-bounce" />
                <Typography type="medium">What makes it secure?</Typography>
            </div>
        </section>
    );
}
