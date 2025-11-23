// Application Configuration
const CONFIG = {
    CONTRACT_ADDRESS: "0x0eaB3CE5D2ee0dA8da0733b86679093Fd7A1a817", //This is the address where your smart contract is deployed (from Ganache).
    DEFAULT_PROVIDER: 'http://127.0.0.1:7545', //If the user does NOT have MetaMask, the app uses Ganache RPC directly.
    NOTIFICATION_TIMEOUT: 5000  //How long a notification stays visible (5 seconds).
};

// Utility Functions
const Utils = {
    shortenAddress: (address) => { // Shortens Ethereum address for display (e.g., 0x1234...abcd)
        if (!address || address === '0x0') return 'Not connected'; // Handle null or zero address
        return `${address.substring(0, 6)}...${address.slice(-4)}`; // First 6 and last 4 characters
    },

    formatAdoptionStatus: (adopterAddress) => { // Returns adoption status and whether adopted
        if (!adopterAddress || adopterAddress === '0x0000000000000000000000000000000000000000') {
            return { status: 'Available', isAdopted: false };
        }
        return { 
            status: `Adopted by: ${Utils.shortenAddress(adopterAddress)}`, 
            isAdopted: true 
        };
    },

    validateResponse: (response) => { // Validates fetch response
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`); // Throw error for non-2xx responses
        }
        return response;
    },

    isSameAddress: (addr1, addr2) => { // Compares two Ethereum addresses case-insensitively
        if (!addr1 || !addr2) return false;
        return addr1.toLowerCase() === addr2.toLowerCase();
    }
};

// Main Application
const App = { // App Object : Everything in the app (account, contract, pets, modals…) is stored inside App
    // State Management
    state: { // Current state of the application
        web3Provider: null,
        account: '0x0',
        transactionInProgress: false,
        pets: [],
        currentModal: null
    },

    contracts: { // Smart contract instances
        Adoption: null
    },

    flags: { // Initialization flags
        petsLoaded: false,
        eventsBound: false,
        web3Initialized: false
    },

    // Initialization
    init: async function() { // Main initialization function
        try {
            console.group('🚀 App Initialization Started');
            
            // Initialize notification container
            this.initNotificationContainer(); // Ensure notification container exists
            
            // Load pets data
            if (!this.flags.petsLoaded) { // Load pets only once
                await this.loadPets();
                this.flags.petsLoaded = true;
            }

            // Initialize Web3 and contract
            await this.initWeb3(); // Setup Web3 provider and account
            await this.initContract(); // Load and initialize smart contract

            // Bind event listeners
            if (!this.flags.eventsBound) { // Bind events only once
                this.bindEvents();
                this.flags.eventsBound = true;
            }

            console.groupEnd(); // End of initialization group
            this.showNotification('Application initialized successfully!', 'success');

        } catch (error) {
            console.error('Initialization failed:', error);
            this.handleError('Initialization failed:', error);
        }
    },

    initNotificationContainer: function() { // Ensure notification container exists
        if ($('#notification-container').length === 0) {
            $('body').append('<div id="notification-container"></div>');
        }
    },

    // Web3 Initialization
    initWeb3: async function() { // Setup Web3 provider and account
        try {
            if (window.ethereum) {
                this.state.web3Provider = window.ethereum; // Modern dapp browsers
                console.log('🔗 Using MetaMask provider');
                
                // Request account access
                await this.requestAccounts();
                this.setupEthereumListeners();
                
            } else if (window.web3) {
                this.state.web3Provider = window.web3.currentProvider;
                console.log('🔗 Using legacy Web3 provider');
                await this.loadAccount();
            } else {
                this.state.web3Provider = new Web3.providers.HttpProvider(CONFIG.DEFAULT_PROVIDER);
                console.log('🔗 Using local Web3 provider');
                await this.loadAccount();
            }

            // Initialize Web3 instance
            web3 = new Web3(this.state.web3Provider);
            this.flags.web3Initialized = true;

        } catch (error) {
            throw new Error(`Web3 initialization failed: ${error.message}`);
        }
    },

    requestAccounts: async function() { // Request account access from MetaMask
        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) { // If user approved access
                this.state.account = accounts[0];
                $('#accountAddress').text(Utils.shortenAddress(this.state.account));
                console.log('👤 Initial account:', this.state.account);
            }
            
        } catch (error) {
            console.error('Error requesting accounts:', error);
            // If user denies connection, try to get accounts without request
            await this.loadAccount();
        }
    },

  setupEthereumListeners: function() { // Setup listeners for MetaMask events
    if (window.ethereum) {

        // Accounts changed event
        window.ethereum.on('accountsChanged', async (accounts) => { // Handle account changes
            console.log('🔄 Accounts changed:', accounts); 

            if (accounts.length === 0) { 
                // User disconnected all accounts
                this.state.account = '0x0';
                this.showNotification('🔌 All accounts disconnected', 'warning');
            } else {
                // User switched accounts
                const newAccount = accounts[0];
                if (!Utils.isSameAddress(this.state.account, newAccount)) {
                    this.state.account = newAccount;
                    this.showNotification(`🔄 Switched to account: ${Utils.shortenAddress(newAccount)}`, 'info');
                }
            }

            // Update UI and adoption info
            this.updateUI();              // Update account display
            await this.refreshAccounts(); // Refresh pet adoption statuses for the new account
        });

        // Chain changed event
        window.ethereum.on('chainChanged', (chainId) => { // Handle network changes
            console.log('🔄 Network changed:', chainId);
            this.showNotification('🔄 Network changed, reloading page...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });

        // Connect event
        window.ethereum.on('connect', (connectInfo) => { // Handle connection event
            console.log('🔗 Connected to chain:', connectInfo);
            this.showNotification('🔗 Wallet connected', 'success');
        });

        // Disconnect event
        window.ethereum.on('disconnect', (error) => {
            console.log('🔌 Disconnected:', error);
            this.showNotification('🔌 Disconnected from wallet', 'warning');
            this.state.account = '0x0';
            this.updateAccountDisplay();
        });
    }
}
,

    loadAccount: async function() { // Load the current Ethereum account
        try {
            if (!this.flags.web3Initialized) {
                console.log('⏳ Web3 not initialized yet');
                return;
            }

            const accounts = await web3.eth.getAccounts();
            console.log('📝 Available accounts:', accounts);
            
            if (accounts.length === 0) {
                this.state.account = '0x0';
                $('#accountAddress').text('Not connected');
                console.log('⚠️ No accounts available');
            } else {
                const currentAccount = accounts[0];
                if (!Utils.isSameAddress(this.state.account, currentAccount)) {
                    this.state.account = currentAccount;
                    $('#accountAddress').text(Utils.shortenAddress(this.state.account));
                    console.log('👤 Loaded account:', this.state.account);
                }
            }

        } catch (error) {
            console.error('Error loading account:', error);
            this.state.account = '0x0';
            $('#accountAddress').text('Error loading account');
        }
    },

    // Contract Initialization
    initContract: async function() { // Load and initialize smart contract
        try {
            const response = await fetch('../build/contracts/Adoption.json'); // Fetch contract JSON
            Utils.validateResponse(response);
            
            const contractData = await response.json(); // Parse JSON data
            this.contracts.Adoption = new web3.eth.Contract( // Initialize contract instance
                contractData.abi,  // Use ABI from JSON
                CONFIG.CONTRACT_ADDRESS // Use deployed contract address
            );

            console.log('📄 Contract initialized at:', CONFIG.CONTRACT_ADDRESS); 
            await this.updateAdoptionStatus(); // Update adoption status on initialization

        } catch (error) {
            throw new Error(`Contract initialization failed: ${error.message}`);
        }
    },

    // Data Loading
    loadPets: async function() { // Load pets data from JSON file
        try {
            console.log('🐕 Loading pets data...'); 
            const response = await fetch('../pets.json');
            Utils.validateResponse(response);
            
            this.state.pets = await response.json();
            this.renderPets();
            
            console.log(`✅ Loaded ${this.state.pets.length} pets`);

        } catch (error) {
            this.handleError('Error loading pets:', error);
        }
    },

    renderPets: function() { // Render pet cards in the UI
        const petsRow = $('#petsRow');
        const petTemplate = $('#petTemplate').children().first(); // Get the first child of template
        
        petsRow.empty();

        this.state.pets.forEach(pet => {
            const petCard = this.createPetCard(pet, petTemplate);
            petsRow.append(petCard);
        });
    },

    createPetCard: function(pet, template) { // Create a pet card from template and pet data
        // Clone the template (not the container)
        const card = template.clone();
        
        // Set basic information
        card.find('.panel-title').text(pet.name);
        card.find('.pet-image').attr('src', pet.picture).attr('alt', pet.name);
        card.find('.pet-breed').text(pet.breed);
        card.find('.pet-age').text(`${pet.age} years`);
        card.find('.pet-location').text(pet.location);
        card.find('.btn-adopt').attr('data-id', pet.id);
        card.find('.btn-view-details').attr('data-id', pet.id);

        // Handle optional fields
        this.setOptionalField(card, '.pet-gender', pet.gender); // Gender
        this.setOptionalField(card, '.pet-size', pet.size);
        this.setVaccinationStatus(card, pet.vaccinated);
        this.setDescription(card, pet.description);

        return card;
    },

    setOptionalField: function(card, selector, value) { // Set optional field or hide if not available
        const element = card.find(selector);
        const container = element.closest('.detail-item');
        
        if (value) {
            element.text(value); // Set the text
            container.show();
        } else {
            container.hide();
        }
    },

    setVaccinationStatus: function(card, vaccinated) { // Set vaccination status or hide if not available
        const element = card.find('.pet-vaccinated');
        const container = element.closest('.detail-item');
        
        if (vaccinated !== undefined) {
            element.text(vaccinated ? 'Yes' : 'No')
                   .removeClass('text-success text-warning')
                   .addClass(vaccinated ? 'text-success' : 'text-warning');
            container.show();
        } else {
            container.hide();
        }
    },

    setDescription: function(card, description) { // Set short description or hide if not available
        const container = card.find('.pet-description-preview');
        const element = card.find('.pet-description-short');
        
        if (description) {
            const shortDesc = description.length > 100 ? 
                `${description.substring(0, 100)}...` : description;
            element.text(shortDesc);
            container.show();
        } else {
            container.hide();
        }
    },

    // Event Handling
    bindEvents: function() { // Bind event listeners to UI elements
        if (this.flags.eventsBound) return;

        // Remove existing event handlers to prevent duplicates
        $(document).off('click', '.btn-adopt'); // Adopt button
        $(document).off('click', '.btn-view-details'); // View Details button
        $(document).off('click', '.btn-adopt-from-modal'); // Adopt button inside modal

        // Bind new event handlers
        $(document).on('click', '.btn-adopt', (e) => this.handleAdopt(e)); // Adopt button
        $(document).on('click', '.btn-view-details', (e) => {
            e.preventDefault();
            const petId = parseInt($(e.currentTarget).data('id'));
            this.showPetDetails(petId);
        });
        $(document).on('click', '.btn-adopt-from-modal', (e) => { // Adopt button inside modal
            e.preventDefault();
            const petId = parseInt($(e.currentTarget).data('id'));
            this.handleModalAdopt(petId);
        });

        // Refresh button (optional - you can add this to your HTML)
        $(document).on('click', '#refreshAccounts', () => { // Refresh accounts button
            this.refreshAccounts();
        });

        // Window events
        $(window).on('focus', () => { // Refresh accounts when window gains focus
            console.log('🔄 Window focused, refreshing accounts...');
            this.refreshAccounts();
        });

        this.flags.eventsBound = true; // Mark events as bound
        console.log('🎯 Event handlers bound successfully');
    },

    refreshAccounts: async function() { // Refresh account and adoption status
        try {
            console.log('🔄 Refreshing accounts...');
            await this.loadAccount();
            await this.updateAdoptionStatus();
        } catch (error) {
            console.error('Error refreshing accounts:', error);
        }
    },

handleModalAdopt: function(petId) { // Handle adopt button click from modal
    try {
        // Close & dispose modal cleanly
        if (this.state.currentModal) {
            this.state.currentModal.hide();
            this.state.currentModal.dispose();   // VERY IMPORTANT
            this.state.currentModal = null;
        }

        // Delay prevents bootstrap animation conflict + double call
        setTimeout(() => {
            const adoptButton = $(`.btn-adopt[data-id="${petId}"]`);

            if (adoptButton.length) {
                adoptButton.trigger('click');   // execute the normal adopt flow
            } else {
                console.error("Adopt button not found for pet:", petId);
            }
        }, 150);

    } catch (err) {
        console.error("Error in handleModalAdopt:", err);
    }
}
,

    // Adoption Process
    handleAdopt: async function(event) { // Handle adopt button click
        event.preventDefault();
        
        if (this.state.transactionInProgress) {
            console.log('⏳ Transaction already in progress, ignoring click');
            return;
        }

        const button = $(event.currentTarget);
        const petId = parseInt(button.data('id'));

        // Prevent multiple clicks
        if (button.attr('disabled')) {
            return;
        }

        // Check if we have a valid account
        if (!this.state.account || this.state.account === '0x0') {
            this.showNotification('❌ Please connect your wallet first', 'error');
            return;
        }

        this.state.transactionInProgress = true;
        this.setButtonState(button, 'processing');
        
        // Show current account in notification
        this.showNotification(`🔄 Submitting transaction from: ${Utils.shortenAddress(this.state.account)}`, 'info');

        try {
            await this.executeAdoption(petId);
            await this.updateAdoptionStatus();
            
            this.showNotification('🎉 Pet adopted successfully!', 'success');
            this.setButtonState(button, 'adopted');

        } catch (error) {
            this.handleAdoptionError(error, button);
        } finally {
            this.state.transactionInProgress = false;
        }
    },

    executeAdoption: async function(petId) { // Execute the adoption transaction
        // Always get fresh accounts list to ensure we're using the current selected account
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];
        
        if (!currentAccount) {
            throw new Error('No Ethereum account found. Please connect your wallet.');
        }

        // Update our state with the current account
        if (!Utils.isSameAddress(this.state.account, currentAccount)) {
            this.state.account = currentAccount;
            $('#accountAddress').text(Utils.shortenAddress(this.state.account));
            console.log('🔄 Updated to current account:', this.state.account);
        }

        console.log(`🏠 Adopting pet ID: ${petId} from account: ${this.state.account}`);
        
        return await this.contracts.Adoption.methods.adopt(petId)
            .send({ 
                from: this.state.account,
                gas: 500000 // Explicit gas limit to prevent estimation issues
            });
    },

    setButtonState: function(button, state) { // Update button appearance based on state
        const states = {
            processing: { 
                text: 'Processing...', 
                disabled: true, 
                class: 'btn-warning' 
            },
            adopted: { 
                text: 'Adopted!', 
                disabled: true, 
                class: 'btn-success' 
            },
            default: { 
                text: 'Adopt', 
                disabled: false, 
                class: 'btn-primary' 
            }
        };
        
        const config = states[state] || states.default;
        
        button.text(config.text)
              .attr('disabled', config.disabled)
              .removeClass('btn-primary btn-warning btn-success')
              .addClass(config.class);
    },

    handleAdoptionError: function(error, button) { // Handle errors during adoption
        console.error('Adoption error:', error);
        
        this.setButtonState(button, 'default');

        let userMessage = 'Adoption failed. Please try again.';
        let notificationType = 'error';

        if (error.code === 4001) {
            userMessage = 'Transaction rejected by user.';
            notificationType = 'warning';
        } else if (error.message?.includes('revert')) {
            userMessage = 'This pet has already been adopted!';
        } else if (error.message?.includes('gas')) {
            userMessage = 'Gas calculation error. Please try again.';
        } else if (error.message?.includes('account')) {
            userMessage = 'Account error. Please check your wallet connection.';
        }

        this.showNotification(`❌ ${userMessage}`, notificationType);
    },

    // UI Updates
    updateUI: function() { // Update UI elements based on current state
        this.updateAccountDisplay();
        this.updateAdoptionStatus();
    },

    updateAccountDisplay: function() { // Update displayed account address
        $('#accountAddress').text(Utils.shortenAddress(this.state.account));
        
        // Update any other account displays if needed
        $('.current-account').text(Utils.shortenAddress(this.state.account));
    },

    updateAdoptionStatus: async function() { // Update adoption status of all pets
        if (!this.contracts.Adoption) {
            console.log('⏳ Contract not ready yet');
            return;
        }

        try {
            const adopters = await this.contracts.Adoption.methods.getAdopters().call();
            console.log('📊 Adopters data:', adopters);
            
            this.updatePetCards(adopters);
            this.updateDashboard(adopters);

        } catch (error) {
            console.error('Error updating adoption status:', error);
        }
    },

    updatePetCards: function(adopters) { // Update each pet card with adoption status
        $('.pet-card').each((index, cardElement) => {
            const card = $(cardElement);
            const adopterAddress = adopters[index];
            const { status, isAdopted } = Utils.formatAdoptionStatus(adopterAddress);
            
            this.updateCardStatus(card, status, isAdopted);
        });
    },

    updateCardStatus: function(card, status, isAdopted) { // Update individual pet card status
        const adopterSpan = card.find('.adopter');
        const adoptButton = card.find('.btn-adopt');
        
        adopterSpan.text(status)
                   .removeClass('status-available status-adopted')
                   .addClass(isAdopted ? 'status-adopted' : 'status-available');
        
        if (isAdopted) {
            this.setButtonState(adoptButton, 'adopted');
        } else {
            this.setButtonState(adoptButton, 'default');
        }
    },

    updateDashboard: function(adopters) { // Update dashboard statistics
        const totalPets = this.state.pets.length;
        const adoptedPets = adopters.filter(addr => 
            addr !== '0x0000000000000000000000000000000000000000').length;
        const availablePets = totalPets - adoptedPets;
        const adoptionPercent = totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : 0;

        $('#totalPets').text(totalPets);
        $('#adoptedPets').text(adoptedPets);
        $('#availablePets').text(availablePets);
        $('#adoptionProgress').css('width', `${adoptionPercent}%`)
                             .attr('aria-valuenow', adoptionPercent);
        $('#adoptionPercentage').text(`${adoptionPercent}% Adopted`);
    },

    // Pet Details Modal
    showPetDetails: async function(petId) { // Show pet details in modal
        try {
            console.log(`🔍 Showing details for pet ID: ${petId}`);
            
            const pet = this.state.pets.find(p => p.id === petId);
            if (!pet) {
                throw new Error(`Pet with ID ${petId} not found`);
            }

            // Get adoption status
            let adoptionStatus = 'Available';
            let statusBadgeClass = 'bg-success';
            let canAdopt = true;

            if (this.contracts.Adoption) {
                try {
                    const adopters = await this.contracts.Adoption.methods.getAdopters().call();
                    const adopterAddress = adopters[petId];
                    const { status, isAdopted } = Utils.formatAdoptionStatus(adopterAddress);
                    
                    adoptionStatus = status;
                    statusBadgeClass = isAdopted ? 'bg-primary' : 'bg-success';
                    canAdopt = !isAdopted;
                } catch (error) {
                    console.error('Error getting adoption status:', error);
                }
            }

            // Populate modal content
            this.populateModalContent(pet, adoptionStatus, statusBadgeClass, canAdopt);
            
            // Show modal using Bootstrap 5
            const modalElement = document.getElementById('petDetailsModal');
            if (modalElement && typeof bootstrap !== 'undefined') {
                this.state.currentModal = new bootstrap.Modal(modalElement);
                this.state.currentModal.show();
            } else {
                throw new Error('Bootstrap not loaded properly');
            }

        } catch (error) {
            console.error('Error showing pet details:', error);
            this.showNotification('Error loading pet details: ' + error.message, 'error');
        }
    },

    populateModalContent: function(pet, adoptionStatus, statusBadgeClass, canAdopt) { // Populate modal with pet details
        const modalBody = $('#modalBody'); // Modal body container
        // Clear existing content
        modalBody.html(` 
            <div class="row">
                <div class="col-md-6 text-center">
                    <img src="${pet.picture}" class="img-fluid rounded mb-3" alt="${pet.name}" 
                         style="max-height: 300px; object-fit: cover;">
                    <div class="status-badge">
                        <span class="badge ${statusBadgeClass} fs-6 p-2">${adoptionStatus}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <h4 class="text-primary">${pet.name}</h4>
                    <p class="text-muted">${pet.breed}</p>
                    
                    <div class="pet-info">
                        <div class="mb-2"><strong>📍 Location:</strong> ${pet.location}</div>
                        <div class="mb-2"><strong>🎂 Age:</strong> ${pet.age} years</div>
                        ${pet.gender ? `<div class="mb-2"><strong>⚤ Gender:</strong> ${pet.gender}</div>` : ''}
                        ${pet.size ? `<div class="mb-2"><strong>📏 Size:</strong> ${pet.size}</div>` : ''}
                        ${pet.vaccinated !== undefined ? 
                            `<div class="mb-2"><strong>💉 Vaccinated:</strong> 
                                <span class="${pet.vaccinated ? 'text-success' : 'text-warning'}">
                                    ${pet.vaccinated ? '✅ Yes' : '❌ No'}
                                </span>
                            </div>` : ''}
                        <div class="mb-2"><strong>🆔 Pet ID:</strong> ${pet.id}</div>
                    </div>
                    
                    ${pet.description ? `
                        <div class="mt-4">
                            <h6>About ${pet.name}:</h6>
                            <p class="mt-2 p-3 bg-light rounded">${pet.description}</p>
                        </div>
                    ` : ''}
                    
                    ${canAdopt ? `
                        <div class="mt-3">
                            <button class="btn btn-primary w-100 btn-adopt-from-modal" data-id="${pet.id}">
                                🏠 Adopt ${pet.name}
                            </button>
                            <small class="text-muted d-block mt-2 text-center">
                                Using account: ${Utils.shortenAddress(this.state.account)}
                            </small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `);
    },

    // Notification System
    showNotification: function(message, type = 'info') { // Show notification toast
        const notificationClass = this.getNotificationClass(type); // Get Bootstrap class
        const notificationIcon = this.getNotificationIcon(type); // Get icon based on type
        
        const notification = $(`
            <div class="alert alert-${notificationClass} alert-dismissible fade show notification-toast" role="alert">
                <strong>${notificationIcon}</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('#notification-container').append(notification);
        
        // Auto-remove after timeout
        setTimeout(() => {
            if (notification.length) {
                notification.alert('close');
            }
        }, CONFIG.NOTIFICATION_TIMEOUT);
    },

    getNotificationClass: function(type) { // Map notification type to Bootstrap class
        const classes = { 
            success: 'success', 
            error: 'danger', 
            warning: 'warning', 
            info: 'info' 
        };
        return classes[type] || 'info';
    },

    getNotificationIcon: function(type) { // Map notification type to icon
        const icons = { 
            success: '✅', 
            error: '❌', 
            warning: '⚠️', 
            info: 'ℹ️' 
        };
        return icons[type] || 'ℹ️';
    },

    // Error Handling
    handleError: function(context, error) {
        console.error(context, error);
        this.showNotification(`${context} ${error.message}`, 'error');
    }
};

// Initialize application when DOM is ready
$(document).ready(function() { // DOM ready
    console.log('📄 DOM ready, initializing application...');
    
    // Check if Bootstrap is loaded
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap not loaded!');
    } else {
        console.log('✅ Bootstrap loaded successfully');
    }
    
    App.init();
});

// Global error handler for uncaught errors
window.addEventListener('error', function(event) { // Global error handler
    console.error('Global error:', event.error);
    App.showNotification('An unexpected error occurred. Please check the console.', 'error');
});