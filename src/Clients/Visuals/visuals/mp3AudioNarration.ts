/*
 *  Power BI Visualizations
 *  
 *  HTML5 MP3 Audio Narration
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
 */

module powerbi.visuals {
    export class MP3AudioNarration implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                    displayName: 'MP3 Audio URL'
                },
            ],
            dataViewMappings: [{
                categories: {
                    for: { in: 'Category' },
                    dataReductionAlgorithm: { top: {} }
                },
            }],
            objects: {
                general: {
                    displayName: 'Audio Options',
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
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

        public static converter(dataView: DataView): any {

            var audioFileValue = null;
            if (!dataView.table.rows[1]) {
                audioFileValue = 'http://fightmusic.com/mp3/big10/Michigan__Hail_To_The_Victors.mp3';
            }
            else {
                audioFileValue = dataView.table.rows[1];
            }

            return audioFileValue;
        }

        public init(options: VisualInitOptions): void {

            d3.select(options.element.get(0)).append("audio");

        }

        public update(options: VisualUpdateOptions) {

            this.dataView = options.dataViews[0];

            var audioSource = MP3AudioNarration.converter(options.dataViews[0]);
            var loopOption = this.getLoopOption(this.dataView);
            var controlsOption = this.getControlsOption(this.dataView);
            var autoplayOption = this.getAutoplayOption(this.dataView);

            var audio = d3.select("audio");
            audio.attr('src', audioSource);
            audio.attr('id', 'htmlAudio');
            audio.attr('type', 'audio/mpeg');
            if (loopOption === true) {
                audio.attr('loop', 'loop');
            }
            else {
                var player = $('#htmlAudio');
                player.removeAttr('loop');
            }
            if (controlsOption === true) {
                var player = $('#htmlAudio');
                audio.attr('controls', 'controls');
            }
            else {
                var player = $('#htmlAudio');
                player.removeAttr('controls');
            }
            if (autoplayOption === true) {
                audio.attr('autoplay', 'autoplay');
            }
            else {
                var player = $('#htmlAudio');
                player.removeAttr('autoplay');
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

module powerbi.visuals.plugins {
    export var _mp3AudioNarration: IVisualPlugin = {
        name: '_mp3AudioNarration',
        class: '_MP3AudioNarration',
        capabilities: MP3AudioNarration.capabilities,
        create: () => new MP3AudioNarration()
    };
}