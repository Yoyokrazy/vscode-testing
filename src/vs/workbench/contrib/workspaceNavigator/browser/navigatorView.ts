/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/navigator.css';
import { MutableDisposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { NavigatorWidget } from './navigatorWidget.js';

export class NavigatorView extends ViewPane {
	private readonly widget = this._register(new MutableDisposable<NavigatorWidget>());
	private bodyContainer: HTMLElement | undefined;
	private pendingResource: URI | undefined;

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
		this._register(this.onDidChangeBodyVisibility(visible => this.updateWidget(visible)));
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		this.bodyContainer = container;
		this.updateWidget(this.isBodyVisible());
	}

	private updateWidget(visible: boolean): void {
		if (!visible) {
			this.widget.clear();
		} else if (this.bodyContainer && !this.widget.value) {
			this.widget.value = this.instantiationService.createInstance(NavigatorWidget, this.bodyContainer);
			if (this.pendingResource) {
				this.widget.value.reveal(this.pendingResource);
				this.pendingResource = undefined;
			}
		}
	}

	reveal(resource: URI): void {
		if (this.widget.value) {
			this.widget.value.reveal(resource);
		} else {
			this.pendingResource = resource;
		}
	}

	override focus(): void {
		super.focus();
		this.widget.value?.focus();
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		if (this.bodyContainer) {
			this.bodyContainer.style.height = `${height}px`;
		}
	}
}
