import { StyleSheet } from "react-native";
import {
  spacing,
  fontSize,
  containerPadding,
  cardPadding,
  buttonHeight,
  borderRadius,
  isTablet
} from "../../utils/responsive";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: containerPadding.vertical + 30,
    paddingHorizontal: containerPadding.horizontal,
  },
  textTitle: {
    fontSize: fontSize.title,
    fontWeight: "bold",
    textAlign: 'center',
  },
  alert: {
    color: "#1D3557", // Dark Blue
  },
  alertWelcome: {
    color: "#1D3557", // Dark Blue
    textAlign: 'center',
  },
  davao: {
    color: "black",
    marginLeft: spacing.sm,
    fontSize: fontSize.xl,
  },
  subheading: {
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
    fontWeight: "bold",
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  flagStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#fee2e2',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  flagStatusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#991b1b',
  },
  notificationIconContainer: {
    position: 'relative',
    padding: spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E63946',
    borderRadius: isTablet ? 12 : 10,
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  notificationPopup: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    padding: cardPadding,
    width: isTablet ? '60%' : '85%',
    maxWidth: isTablet ? 600 : undefined,
    maxHeight: '70%',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  closeButton: {
    padding: 5,
  },
  notificationList: {
    maxHeight: 300,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationItemUnread: {
    backgroundColor: '#f8f9fa',
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationItemMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationItemTime: {
    fontSize: 12,
    color: '#999',
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  subheadingNoMargin: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subheadingCenter: {
    fontSize: 20,
    marginTop: 15,
    marginBottom: 15,
    fontWeight: "bold",
    textAlign: 'center',
  },
  buttonWrapper: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden", // makes button corners rounded
  },

  buttonWrapperHover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: "space-between",
  },

  cardText: {
    marginTop: 10,
    fontSize: 16,
    color: "#1D3557",
    fontWeight: "500",
  },
  normalTxtCentered: {
    textAlign: 'center',
    color: 'gray',
    paddingBottom: 15,
  },
  subheading2: {
    fontSize: 15,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    borderColor: "#1D3557",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 15,
    width: "100%",
    alignSelf: "center",
  },

  inputFlex: {
    height: 40,
    borderColor: "#1D3557",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    marginBottom: 15,
    flex: 1,
  },

  normalTxtJustify: {
    margin: 5,
    color: 'gray',
    paddingBottom: 5,
    textAlign: 'justify'
  },
  normalTxt: {
    margin: 1,
    color: 'gray',
    paddingBottom: 1,
  },
  termsBox: {
    flex: 1,
    marginBottom: 15,
  },
  termsText: {
    color: "#1D3557",
    fontWeight: "bold",
  },

  loginLinkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  loginLinkText: {
    color: '#555',
  },

  loginLink: {
    color: '#1D3557',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  screen: { padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginVertical: 8 },
  textArea: { height: 100, textAlignVertical: 'top' },
  subheadingAlt: { fontSize: 18, fontWeight: '600', marginVertical: 12 },
  card: { padding: 8, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1D3557',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: { backgroundColor: '#1D3557' },
  checkboxTick: { color: '#fff', fontWeight: 'bold' },
  checkboxText: { fontSize: 16 },
  locationButton: {
    backgroundColor: '#1D3557',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  imagePreview: { width: "100%", height: 200, marginTop: 8, borderRadius: 8 },
  submitButton: { marginTop: 20 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    backgroundColor: "#1D3557",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    overflow: 'hidden',
  },
  reportButton: {
    backgroundColor: "#1D3557",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },

  reportButtonPressed: {
    backgroundColor: "#1a2e4d", // Darkened background color
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
    transform: [{ scale: 0.95 }], // Slightly smaller when pressed
  },

  reportButtonText: {
    color: "#fff",
    backgroundColor: "#1D3557",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },

  templateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1D3557',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },

  templateButtonText: {
    color: '#1D3557',
    fontSize: 16,
    fontWeight: '600',
  },

  anonymousButton: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#1D3557',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },

  anonymousButtonText: {
    color: '#1D3557',
    fontSize: 16,
    fontWeight: 'bold',
  },

  cardGrid: {
    width: "48%",
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    // boxShadow replaced with React Native shadow properties to fix web error
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  chatBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E63946',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  chatBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  cardGridPressed: {
    width: "48%",
    height: 120,
    backgroundColor: "#f0f0f0", // Darkened background color
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.05, // Reduced opacity
    shadowRadius: 2, // Reduced radius
    elevation: 1, // Reduced elevation
    transform: [{ scale: 0.95 }], // Slightly smaller when pressed
  },
  backButton: {

  },
  backArrow: {
    fontSize: 28,
    color: '#333',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    position: 'relative' as any,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e5e5e5',
  },
  verifiedBadge: {
    marginTop: 6,
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  verifiedText: {
    color: 'gray',
    fontSize: 12,
  },
  flagBadgeContainer: {
    position: 'absolute' as any,
    top: 10,
    right: 10,
    zIndex: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  buttonsContainer: {
    marginTop: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#e5e5e5',
    borderColor: '#e5e5e5',
  },
  disabledText: {
    color: '#999',
    fontSize: 14,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatInfo: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  unreadBadge: {
    backgroundColor: '#1D3557',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10
  },
  officerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10
  },
  officerName: {
    color: '#1D3557',
    fontWeight: '600'
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 15,
    marginBottom: 10
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '75%',
  },
  officerMsg: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    marginRight: '25%',
  },
  userMsg: {
    backgroundColor: '#1D3557',
    alignSelf: 'flex-end',
    marginLeft: '25%',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    color: '#888',
    marginTop: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  chatInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#1D3557',
    borderRadius: 20,
    padding: 10
  },
  headerHistory: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  headerTitleHistory: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 24, // balance the back button space
  },
  cardHistory: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContentHistory: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleHistory: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitleHistory: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
  },
  addressHistory: {
    fontSize: 12,
    color: "#666",
  },
  rightSectionHistory: {
    alignItems: "flex-end",
  },
  dateHistory: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  statusBadgeHistory: {
    backgroundColor: "#e0f7ef",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextHistory: {
    fontSize: 12,
    color: "green",
    fontWeight: "600",
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#1D3557',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1D3557',
    fontWeight: '500',
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mediaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mediaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  mediaSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
    minHeight: 48,
    zIndex: 1,
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  dateButtonEmpty: {
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  dateButtonTextPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#1D3557',
    fontWeight: '600',
  },
  datePickerStyle: {
    backgroundColor: '#fff',
  },
  alternativeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },

  termsCheckboxText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
    marginBottom: 15,
    flex: 1,
  },

  // Duplicates removed

  forgotPasswordText: {
    color: "#1D3557",
    marginTop: 10,
    textAlign: "center",
  },

  signUpText: {
    color: "#457b9d",
    marginTop: 10,
    textAlign: "center",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  showPasswordButton: {
    marginLeft: 10,
  },

  showPasswordText: {
    color: "#1D3557",
  },

  scrollContentContainer: {
    paddingBottom: 50,
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 400,
    width: '85%',
    overflow: 'hidden',
  },

  detailRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  modalCloseButton: {
    backgroundColor: '#1D3557',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Enforcer Modal Styles
  enforcerModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 420,
    width: '90%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  enforcerModalContent: {
    backgroundColor: '#fff',
  },

  enforcerLoadingContainer: {
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  enforcerLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  enforcerErrorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  enforcerErrorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E63946',
    fontWeight: '500',
    textAlign: 'center',
  },

  enforcerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#f8f9fa',
  },

  enforcerHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  enforcerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3557',
  },

  enforcerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 53, 87, 0.1)',
  },

  enforcerDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
  },

  enforcerDetailsContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  enforcerDetailSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  enforcerLastSection: {
    borderBottomWidth: 0,
    marginBottom: 10,
  },

  enforcerIconLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  enforcerDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  enforcerDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginLeft: 30,
  },

  enforcerCloseActionButton: {
    backgroundColor: '#1D3557',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  enforcerCloseActionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

});

export default styles;