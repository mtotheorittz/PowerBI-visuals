/*
 *  Power BI Visualizations
 *  
 *  HTML5 MP3 Audio Narration
 *  v1.0.3
 *
 *  Copyright (c) David Eldersveld, BlueGranite Inc.
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 *
 *  Acknowledgements:
 *  Sample audio available from University of Michigan Health System
 *  http://www.michigandifference.org/about/theme-song.html
 *  "If you enjoy the music, feel free to download the song and use it in your player"
 *
 *  +JMJ+
 */

/* Please make sure that this path is correct */
/// <reference path="../_references.ts"/>

module powerbi.visuals {

    export class AudioNarration implements IVisual {

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Values',
                    kind: powerbi.VisualDataRoleKind.GroupingOrMeasure,
                    displayName: 'Insert Any Field for Audio Options'
                },
            ],
            dataViewMappings: [{
                table: {
                    rows: {
                        for: { in: 'Values' },
                        dataReductionAlgorithm: { window: { count: 100 } }
                    },
                    rowCount: { preferred: { min: 1 } }
                },
            }],
            objects: {
                general: {
                    displayName: 'Audio Options',
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                        mp3Url: {
                            type: { text: true },
                            displayName: 'MP3 URL'
                        },
                        loopOption: {
                            type: { bool: true },
                            displayName: 'Loop'
                        },
                        controlsOption: {
                            type: { bool: true },
                            displayName: 'Controls'
                        },
                        autoplayOption: {
                            type: { bool: true },
                            displayName: 'Autoplay'
                        },
                    },
                }
            },
            suppressDefaultTitle: true,
        };

        private dataView: DataView;
        private audioContainer: D3.Selection;

        public static converter(dataView: DataView): any {
            return {};
        }

        public init(options: VisualInitOptions): void {

            this.audioContainer = d3.select(options.element.get(0)).append("audio");

        }

        public update(options: VisualUpdateOptions) {

            this.dataView = options.dataViews[0];

            var audioSource = this.getAudioSource(this.dataView);
            var loopOption = this.getLoopOption(this.dataView);
            var controlsOption = this.getControlsOption(this.dataView);
            var autoplayOption = this.getAutoplayOption(this.dataView);

            var audio = this.audioContainer;
            audio.attr('src', audioSource);
            audio.attr('class', 'htmlAudio');
            audio.attr('type', 'audio/mpeg');
            if (loopOption === true) {
                audio.attr('loop', 'loop');
            }
            else {
                audio.attr('loop', null);
            }
            if (controlsOption === true) {
                audio.attr('controls', 'controls');
            }
            else {
                audio.attr('controls', null);
            }
            if (autoplayOption === true) {
                audio.attr('autoplay', 'autoplay');
            }
            else {
                audio.attr('autoplay', null);
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            switch (options.objectName) {
                case 'general':
                    var general: VisualObjectInstance = {
                        objectName: 'general',
                        displayName: 'Audio Options',
                        selector: null,
                        properties: {
                            mp3Url: this.getAudioSource(this.dataView),
                            loopOption: this.getLoopOption(this.dataView),
                            controlsOption: this.getControlsOption(this.dataView),
                            autoplayOption: this.getAutoplayOption(this.dataView)
                        }
                    };
                    instances.push(general);
                    break;
            }

            return instances;
        }

        private getAudioSource(dataView: DataView): string {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <string>general['mp3Url'];
                }
            }
            return "https://raw.githubusercontent.com/deldersveld/datasets/master/audio/umhs.mp3";
        }

        private getLoopOption(dataView: DataView): boolean {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <boolean>general['loopOption'];
                }
            }
            return true;
        }

        private getControlsOption(dataView: DataView): boolean {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <boolean>general['controlsOption'];
                }
            }
            return true;
        }

        private getAutoplayOption(dataView: DataView): boolean {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <boolean>general['autoplayOption'];
                }
            }
            return false;
        }
    }
}